"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [position, setPosition] = useState("")
  const [code1, setCode1] = useState("")
  const [code2, setCode2] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === "login") {
        const res = await fetch("http://localhost:8081/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          if (res.status === 401) alert("Login failed: invalid credentials")
          else throw new Error("Network response was not ok")
        } else {
          const user = await res.json()
          // remove password before storing
          const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
          }
          localStorage.setItem("user", JSON.stringify(safeUser))
          router.push("/dashboard")
        }
      } else {
        const fullName = `${name} ${surname}`.trim()
        const res = await fetch("http://localhost:8081/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, email, password, position, code1, code2 }),
        })

        if (!res.ok) {
          if (res.status === 400) alert("Registration failed: check input or codes")
          else throw new Error("Network response was not ok")
        } else {
          const user = await res.json()
          const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
          }
          localStorage.setItem("user", JSON.stringify(safeUser))
          router.push("/dashboard")
        }
      }
    } catch (err) {
      // minimal error handling
      // eslint-disable-next-line no-console
      console.error(err)
      alert("Request failed. Is the backend running on http://localhost:8081/users ?")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create account"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Enter your credentials to access your lab complex"
            : "Register to get access to the lab complex"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="text"
                  placeholder="e.g. Researcher"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="researcher@lab.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code1">Code 1</Label>
                <Input
                  id="code1"
                  type="text"
                  placeholder="Enter code 1"
                  value={code1}
                  onChange={(e) => setCode1(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code2">Code 2</Label>
                <Input
                  id="code2"
                  type="text"
                  placeholder="Enter code 2"
                  value={code2}
                  onChange={(e) => setCode2(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline">
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                  Sign in here
                </button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
