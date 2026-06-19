import { Enki AIMessage } from "@shared/ExtensionMessage"
import { isEnki AIProvider } from "@shared/utils/enki"
import { memo } from "react"
import CreditLimitError from "@/components/chat/CreditLimitError"
import EntitlementError from "@/components/chat/EntitlementError"
import SpendLimitError from "@/components/chat/SpendLimitError"
import { Button } from "@/components/ui/button"
import { useEnki AIAuth, useEnki AISignIn } from "@/context/Enki AIAuthContext"
import { Enki AIError, Enki AIErrorType } from "../../../../src/services/error/Enki AIError"

const _errorColor = "var(--vscode-errorForeground)"

interface ErrorRowProps {
	message: Enki AIMessage
	errorType: "error" | "mistake_limit_reached" | "diff_error" | "enkiignore_error"
	apiRequestFailedMessage?: string
	apiReqStreamingFailedMessage?: string
}

const ErrorRow = memo(({ message, errorType, apiRequestFailedMessage, apiReqStreamingFailedMessage }: ErrorRowProps) => {
	const { enkiUser } = useEnki AIAuth()
	const rawApiError = apiRequestFailedMessage || apiReqStreamingFailedMessage

	const { isLoginLoading, handleSignIn } = useEnki AISignIn()

	const renderErrorContent = () => {
		switch (errorType) {
			case "error":
			case "mistake_limit_reached":
				// Handle API request errors with special error parsing
				if (rawApiError) {
					// FIXME: Enki AIError parsing should not be applied to non-Enki AI providers, but it seems we're using enkiErrorMessage below in the default error display
					const enkiError = Enki AIError.parse(rawApiError)
					const errorMessage = enkiError?._error?.message || enkiError?.message || rawApiError
					const requestId = enkiError?._error?.request_id
					const providerId = enkiError?.providerId || enkiError?._error?.providerId
					const errorCode = enkiError?._error?.code

					if (enkiError?.isErrorType(Enki AIErrorType.Balance)) {
						const errorDetails = enkiError._error?.details
						return (
							<CreditLimitError
								buyCreditsUrl={errorDetails?.buy_credits_url}
								currentBalance={errorDetails?.current_balance}
								message={errorDetails?.message}
								totalPromotions={errorDetails?.total_promotions}
								totalSpent={errorDetails?.total_spent}
							/>
						)
					}

					if (enkiError?.isErrorType(Enki AIErrorType.SpendLimit)) {
						const d = enkiError._error?.details
						return (
							<SpendLimitError
								budgetPeriod={d?.budget_period}
								limitUsd={d?.limit_usd}
								message={d?.message || errorMessage}
								resetsAt={d?.resets_at}
								spentUsd={d?.spent_usd}
							/>
						)
					}

					if (enkiError?.isErrorType(Enki AIErrorType.Entitlement)) {
						const detailMessage = enkiError?._error?.details?.message || errorMessage
						return <EntitlementError message={detailMessage} />
					}

					if (enkiError?.isErrorType(Enki AIErrorType.RateLimit)) {
						return (
							<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</p>
						)
					}

					if (enkiError?.isErrorType(Enki AIErrorType.QuotaExceeded)) {
						const detailMessage = enkiError?._error?.details?.message || errorMessage
						return <p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">{detailMessage}</p>
					}

					if (enkiError?.isErrorType(Enki AIErrorType.Auth) && isEnki AIProvider(providerId)) {
						return !enkiUser ? (
							// User is using Enki AI provider and is not logged in
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-center rounded border border-neutral-500/30 bg-vscode-editor-background p-6 text-center text-vscode-foreground">
									Whoops looks like you're logged out – click below to sign in
								</div>
								<Button className="w-full" disabled={isLoginLoading} onClick={handleSignIn}>
									Sign in to Enki AI
									{isLoginLoading && (
										<span className="ml-1 animate-spin">
											<span className="codicon codicon-refresh" />
										</span>
									)}
								</Button>
							</div>
						) : (
							// Don't show sign in button after the user has logged in, just ask them to retry
							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						)
					}

					return (
						<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere flex flex-col gap-3">
							{/* Display the well-formatted error extracted from the Enki AIError instance */}

							<header>
								{providerId && <span className="uppercase">[{providerId}] </span>}
								{errorCode && <span>{errorCode}</span>}
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</header>

							{/* Windows Powershell Issue */}
							{errorMessage?.toLowerCase()?.includes("powershell") && (
								<div>
									It seems like you're having Windows PowerShell issues, please see this{" "}
									<a
										className="underline text-inherit"
										href="https://github.com/enki/enki/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22">
										troubleshooting guide
									</a>
									.
								</div>
							)}

							{/* Display raw API error if different from parsed error message */}
							{errorMessage !== rawApiError && <div>{rawApiError}</div>}

							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						</p>
					)
				}

				// Regular error message
				return <p className="m-0 mt-0 whitespace-pre-wrap text-error wrap-anywhere">{message.text}</p>

			case "diff_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>The model used search patterns that don't match anything in the file. Retrying...</div>
					</div>
				)

			case "enkiignore_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>
							Enki AI tried to access <code>{message.text}</code> which is blocked by the <code>.enkiignore</code>
							file.
						</div>
					</div>
				)

			default:
				return null
		}
	}

	// For diff_error and enkiignore_error, we don't show the header separately
	if (errorType === "diff_error" || errorType === "enkiignore_error") {
		return renderErrorContent()
	}

	// For other error types, show header + content
	return renderErrorContent()
})

export default ErrorRow
