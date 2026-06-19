import type { UserOrganization } from "@shared/proto/enki/account"
import { EmptyRequest } from "@shared/proto/enki/common"
import deepEqual from "fast-deep-equal"
import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AccountServiceClient } from "@/services/grpc-client"

// Define User type (you may need to adjust this based on your actual User type)
export interface Enki AIUser {
	uid: string
	email?: string
	displayName?: string
	photoUrl?: string
	appBaseUrl?: string
}

export interface Enki AIAuthContextType {
	enkiUser: Enki AIUser | null
	organizations: UserOrganization[] | null
	activeOrganization: UserOrganization | null
}

export const Enki AIAuthContext = createContext<Enki AIAuthContextType | undefined>(undefined)

export const Enki AIAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<Enki AIUser | null>(null)
	const [userOrganizations, setUserOrganizations] = useState<UserOrganization[] | null>(null)

	const getUserOrganizations = useCallback(async () => {
		try {
			const response = await AccountServiceClient.getUserOrganizations(EmptyRequest.create())
			setUserOrganizations((old) => {
				if (!deepEqual(response.organizations, old)) {
					return response.organizations
				}

				return old
			})
		} catch (error) {
			console.error("Failed to fetch user organizations:", error)
		}
	}, [])

	const activeOrganization = useMemo(() => {
		return userOrganizations?.find((org) => org.active) ?? null
	}, [userOrganizations])

	useEffect(() => {
		console.log("Extension: Enki AIAuthContext: user updated:", user?.uid)
	}, [user?.uid])

	// Handle auth status update events
	useEffect(() => {
		const cancelSubscription = AccountServiceClient.subscribeToAuthStatusUpdate(EmptyRequest.create(), {
			onResponse: async (response) => {
				setUser((oldUser) => {
					if (!response?.user?.uid) {
						return null
					}

					if (response?.user && oldUser?.uid !== response.user.uid) {
						// Once we have a new user, fetch organizations that
						// allow us to display the active account in account view UI
						// and fetch the correct credit balance to display on mount
						getUserOrganizations()
						return response.user
					}

					return oldUser
				})
			},
			onError: (error: Error) => {
				console.error("Error in auth callback subscription:", error)
			},
			onComplete: () => {
				console.log("Auth callback subscription completed")
			},
		})

		// Cleanup function to cancel subscription when component unmounts
		return () => {
			cancelSubscription()
		}
	}, [getUserOrganizations])

	return (
		<Enki AIAuthContext.Provider
			value={{
				enkiUser: user,
				organizations: userOrganizations,
				activeOrganization,
			}}>
			{children}
		</Enki AIAuthContext.Provider>
	)
}

export const useEnki AIAuth = () => {
	const context = useContext(Enki AIAuthContext)
	if (context === undefined) {
		throw new Error("useEnki AIAuth must be used within a Enki AIAuthProvider")
	}
	return context
}

export const useEnki AISignIn = () => {
	const [isLoading, setIsLoading] = useState(false)

	const handleSignIn = useCallback(() => {
		try {
			setIsLoading(true)

			AccountServiceClient.accountLoginClicked(EmptyRequest.create())
				.catch((err) => console.error("Failed to get login URL:", err))
				.finally(() => {
					setIsLoading(false)
				})
		} catch (error) {
			console.error("Error signing in:", error)
		}
	}, [])

	return {
		isLoginLoading: isLoading,
		handleSignIn,
	}
}

export const handleSignOut = async () => {
	try {
		await AccountServiceClient.accountLogoutClicked(EmptyRequest.create()).catch((err) =>
			console.error("Failed to logout:", err),
		)
	} catch (error) {
		console.error("Error signing out:", error)
		throw error
	}
}
