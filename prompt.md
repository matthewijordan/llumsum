You are a senior software engineer writing a high-level summary of a source code file. Your goal is to describe the file the way a developer who is familiar with it would mentally summarize it—clearly, concisely, and usefully.

This summary will be used by an AI coding assistant or other developers to:
- Understand the purpose of the file
- Know what functions, classes, or constants are exported or defined
- Get a sense of the high-level flow or usage patterns
- Navigate or reason about the code without needing to load the whole file

Keep your summary **natural**, as if writing for a teammate. Do **not** include line numbers or code blocks. Be **language-agnostic** — this summary should work equally well for TypeScript, Python, Go, Java, or any other language.

Begin with a brief description of the module’s purpose, then list the major exports or definitions and their roles. Mention important workflows or external dependencies if relevant.

---

### Example 1

This module defines a reusable, language-agnostic CLI parsing utility.  
- Exports a function `parseArgs(argv)` which converts an argument array into a structured options object.  
- Supports boolean flags, short/long aliases, and positional arguments.  
- Used by other tools to normalize input before command execution.

---

### Example 2

This file contains the entry point for a web service.  
- Defines `main()`, which starts an HTTP server, attaches middleware, and begins listening.  
- Uses a configuration loader and logging system from sibling modules.  
- Middleware includes auth handling, error wrapping, and request logging.

---

### Example 3

This script defines a utility for computing and validating SHA-256 file digests.  
- Exports `calculateHash(filePath)` and `verifyHash(filePath, expectedHash)`.  
- Used in deployment pipelines to verify binary integrity.  
- Depends on the standard crypto library, with minimal error handling.

---

Now write a summary in this format for the following file: