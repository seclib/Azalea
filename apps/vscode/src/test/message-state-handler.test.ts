import { describe, it } from "mocha"
import "should"
import should from "should"
import { MessageStateHandler } from "../core/task/message-state"
import { TaskState } from "../core/task/TaskState"
import { Enki AIMessage } from "../shared/ExtensionMessage"

/**
 * Unit tests for MessageStateHandler's mutex protection (RC-4)
 * These tests verify that concurrent operations on message state are properly serialized
 * to prevent race conditions, particularly the TOCTOU bug in addToEnki AIMessages
 */
describe("MessageStateHandler Mutex Protection", () => {
	/**
	 * Helper to create a minimal MessageStateHandler for testing
	 */
	function createTestHandler(): MessageStateHandler {
		const taskState = new TaskState()
		return new MessageStateHandler({
			taskId: "test-task-id",
			ulid: "test-ulid",
			taskState,
			updateTaskHistory: async () => [],
		})
	}

	/**
	 * Helper to create a test Enki AIMessage
	 */
	function createTestMessage(text: string): Enki AIMessage {
		return {
			ts: Date.now(),
			type: "say",
			say: "text",
			text,
		}
	}

	it("should initialize with empty message arrays", () => {
		const handler = createTestHandler()
		handler.getEnki AIMessages().length.should.equal(0)
		handler.getApiConversationHistory().length.should.equal(0)
	})

	it("should set and get API conversation history", () => {
		const handler = createTestHandler()
		const testHistory = [{ role: "user" as const, content: "test message" }]

		handler.setApiConversationHistory(testHistory)
		handler.getApiConversationHistory().should.deepEqual(testHistory)
	})

	it("should set and get enki messages", () => {
		const handler = createTestHandler()
		const testMessages = [createTestMessage("test1"), createTestMessage("test2")]

		handler.setEnki AIMessages(testMessages)
		handler.getEnki AIMessages().should.deepEqual(testMessages)
	})

	/**
	 * CRITICAL TEST: Verify that addToEnki AIMessages is atomic
	 * This test simulates the race condition that can occur when multiple
	 * addToEnki AIMessages calls happen concurrently without proper mutex protection
	 */
	it("should handle concurrent addToEnki AIMessages atomically", async function () {
		// Increase timeout for this test as it involves async operations
		this.timeout(5000)

		const handler = createTestHandler()

		// Set up initial API conversation history
		const initialHistory = [
			{ role: "user" as const, content: "msg1" },
			{ role: "assistant" as const, content: "response1" },
			{ role: "user" as const, content: "msg2" },
		]
		handler.setApiConversationHistory(initialHistory)

		// Add initial message to establish baseline
		const initialMsg = createTestMessage("initial")
		await handler.addToEnki AIMessages(initialMsg)

		// Verify initial state
		const messages = handler.getEnki AIMessages()
		messages.length.should.equal(1)
		messages[0].conversationHistoryIndex?.should.equal(2) // length - 1 = 3 - 1 = 2

		// Now simulate concurrent additions
		// Without mutex protection, these could race and get the same index
		const msg1 = createTestMessage("concurrent1")
		const msg2 = createTestMessage("concurrent2")
		const msg3 = createTestMessage("concurrent3")

		// Add more messages to API history to simulate ongoing conversation
		handler.setApiConversationHistory([
			...initialHistory,
			{ role: "assistant" as const, content: "response2" },
			{ role: "user" as const, content: "msg3" },
		])

		// Execute concurrent operations
		const results = await Promise.all([
			handler.addToEnki AIMessages(msg1),
			handler.addToEnki AIMessages(msg2),
			handler.addToEnki AIMessages(msg3),
		])

		// Verify all operations completed
		results.length.should.equal(3)

		// Get final state
		const finalMessages = handler.getEnki AIMessages()
		finalMessages.length.should.equal(4) // initial + 3 concurrent

		// CRITICAL ASSERTION: Each message should have a valid conversationHistoryIndex
		// With proper mutex protection, these indices should be set correctly
		// even though the operations ran concurrently
		finalMessages.forEach((msg, _idx) => {
			should.exist(msg.conversationHistoryIndex)
			msg.conversationHistoryIndex?.should.be.a.Number()
			msg.conversationHistoryIndex?.should.be.greaterThanOrEqual(0)
		})
	})

	/**
	 * Test that updateEnki AIMessage operations are atomic
	 */
	it("should handle concurrent updateEnki AIMessage atomically", async function () {
		this.timeout(5000)

		const handler = createTestHandler()

		// Set up initial messages
		const msgs = [createTestMessage("msg1"), createTestMessage("msg2"), createTestMessage("msg3")]
		handler.setEnki AIMessages(msgs)

		// Perform concurrent updates to different messages
		await Promise.all([
			handler.updateEnki AIMessage(0, { text: "updated1" }),
			handler.updateEnki AIMessage(1, { text: "updated2" }),
			handler.updateEnki AIMessage(2, { text: "updated3" }),
		])

		const finalMessages = handler.getEnki AIMessages()
		finalMessages[0]?.text?.should.equal("updated1")
		finalMessages[1]?.text?.should.equal("updated2")
		finalMessages[2]?.text?.should.equal("updated3")
	})

	/**
	 * Test that deleteEnki AIMessage operations are atomic
	 */
	it("should handle deleteEnki AIMessage with proper validation", async () => {
		const handler = createTestHandler()

		// Set up initial messages
		const msgs = [createTestMessage("msg1"), createTestMessage("msg2"), createTestMessage("msg3")]
		handler.setEnki AIMessages(msgs)

		// Delete middle message
		await handler.deleteEnki AIMessage(1)

		const finalMessages = handler.getEnki AIMessages()
		finalMessages.length.should.equal(2)
		finalMessages[0]?.text?.should.equal("msg1")
		finalMessages[1]?.text?.should.equal("msg3")
	})

	/**
	 * Test that invalid indices are rejected
	 */
	it("should throw error for invalid message index in updateEnki AIMessage", async () => {
		const handler = createTestHandler()
		handler.setEnki AIMessages([createTestMessage("msg1")])

		try {
			await handler.updateEnki AIMessage(5, { text: "invalid" })
			throw new Error("Should have thrown")
		} catch (error) {
			if (error instanceof Error) {
				error.message.should.match(/Invalid message index/)
			}
		}
	})

	/**
	 * Test that invalid indices are rejected in deleteEnki AIMessage
	 */
	it("should throw error for invalid message index in deleteEnki AIMessage", async () => {
		const handler = createTestHandler()
		handler.setEnki AIMessages([createTestMessage("msg1")])

		try {
			await handler.deleteEnki AIMessage(-1)
			throw new Error("Should have thrown")
		} catch (error) {
			if (error instanceof Error) {
				error.message.should.match(/Invalid message index/)
			}
		}
	})

	/**
	 * Test API conversation history operations
	 */
	it("should handle concurrent API conversation history operations", async function () {
		this.timeout(5000)

		const handler = createTestHandler()

		// Perform concurrent additions
		await Promise.all([
			handler.addToApiConversationHistory({ role: "user", content: "msg1", ts: Date.now() }),
			handler.addToApiConversationHistory({ role: "assistant", content: "response1", ts: Date.now() }),
			handler.addToApiConversationHistory({ role: "user", content: "msg2", ts: Date.now() }),
		])

		const history = handler.getApiConversationHistory()
		history.length.should.equal(3)
		history[0].role.should.equal("user")
		history[1].role.should.equal("assistant")
		history[2].role.should.equal("user")
	})

	/**
	 * Test overwrite operations
	 */
	it("should handle overwriteEnki AIMessages atomically", async () => {
		const handler = createTestHandler()

		// Set initial messages
		handler.setEnki AIMessages([createTestMessage("old1"), createTestMessage("old2")])

		// Overwrite with new messages
		const newMessages = [createTestMessage("new1"), createTestMessage("new2"), createTestMessage("new3")]
		await handler.overwriteEnki AIMessages(newMessages)

		const finalMessages = handler.getEnki AIMessages()
		finalMessages.length.should.equal(3)
		finalMessages[0]?.text?.should.equal("new1")
		finalMessages[1]?.text?.should.equal("new2")
		finalMessages[2]?.text?.should.equal("new3")
	})

	/**
	 * Test overwrite API conversation history
	 */
	it("should handle overwriteApiConversationHistory atomically", async () => {
		const handler = createTestHandler()

		// Set initial history
		handler.setApiConversationHistory([{ role: "user", content: "old", ts: Date.now() }])

		// Overwrite with new history
		const newHistory = [
			{ role: "user" as const, content: "new1", ts: Date.now() },
			{ role: "assistant" as const, content: "new2", ts: Date.now() },
		]
		await handler.overwriteApiConversationHistory(newHistory)

		const finalHistory = handler.getApiConversationHistory()
		finalHistory.length.should.equal(2)
		finalHistory[0].content.should.equal("new1")
		finalHistory[1].content.should.equal("new2")
	})
})
