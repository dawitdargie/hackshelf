package config

import "github.com/joho/godotenv"

// LoadDotEnv loads variables from a .env file in the current working directory
// so local development can use the documented "copy .env.example to .env"
// workflow.
//
// A missing .env file is not an error, and variables already present in the
// process environment are never overridden. Containers and production
// deployments that set real environment variables are therefore unaffected.
func LoadDotEnv() {
	_ = godotenv.Load()
}
