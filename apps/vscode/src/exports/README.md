# Enki AI API

The Enki AI extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/enki.d.ts` to your extension's source directory.
2. Include `enki.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const enkiExtension = vscode.extensions.getExtension<Enki AIAPI>("saoudrizwan.claude-dev")

    if (!enkiExtension?.isActive) {
    	throw new Error("Enki AI extension is not activated")
    }

    const enki = enkiExtension.exports

    if (enki) {
    	// Now you can use the API

    	// Start a new task with an initial message
    	await enki.startNewTask("Hello, Enki AI! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await enki.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await enki.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await enki.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await enki.pressSecondaryButton()
    } else {
    	console.error("Enki AI API is not available")
    }
    ```

    **Note:** To ensure that the `saoudrizwan.claude-dev` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `enki.d.ts` file.
