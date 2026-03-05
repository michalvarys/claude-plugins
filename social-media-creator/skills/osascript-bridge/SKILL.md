---
name: osascript-bridge
description: >
  Patterns for executing commands on the Mac host from a Cowork VM session via osascript.
  Use this skill whenever you encounter ENOSPC (disk full) errors in the Cowork VM,
  need to run Node.js/Python on the Mac host, execute background processes,
  or write files to the Mac filesystem when the VM disk is full.
  Also use when the user mentions osascript, AppleScript, Mac host commands,
  or when tools like Puppeteer/ffmpeg need to run natively on macOS.
version: 0.1.0
---

# osascript Bridge: Mac Host Commands from Cowork VM

When the Cowork VM disk is full (ENOSPC errors) or you need Mac-native tools
(Puppeteer with Chrome, ffmpeg, nvm-managed Node.js), use osascript to bridge
to the Mac host. This skill documents proven patterns and common pitfalls.

## Core Principle

Keep osascript usage minimal. Write a Python script to /tmp on the Mac,
then execute it with a single osascript call. Avoid complex string escaping
inside osascript.
## Pattern 1: Base64 Encode/Decode Pipeline (RECOMMENDED)

The most robust approach for writing files with complex content.
Encode content in the VM Python, pass the base64 string to osascript,
decode on Mac.

In the Cowork VM, use base64.b64encode(content).decode() to get a safe
alphanumeric string. Then pass that string via osascript to decode on Mac.

Why this works: Base64 is pure alphanumeric, no escaping needed.
Best for: Files with code examples, nested quotes, any complex content.

## Pattern 2: Write Python Script to /tmp, Then Execute

Write a Python script to /tmp on the Mac using cat-heredoc then run it.
Use a single-quoted heredoc marker to prevent shell expansion.
Then execute with: python3 /tmp/myscript.py

Key constraint: Python script content must NOT contain double-quote
characters when wrapped in do-shell-script. Use lines.append with
single-quoted strings instead.

## Pattern 3: Echo-Append for Short Files

For files under 30 lines, build line by line with echo >> append.
Simple but tedious for long files.

## Pattern 4: Background Process Execution

Long-running processes (video rendering, batch operations) must run in
the background because osascript has timeouts.

Steps:
1. Write a wrapper shell script to /tmp (via Pattern 2)
2. chmod +x via osascript
3. Launch via Python subprocess.Popen with start_new_session=True

Why subprocess.Popen works: start_new_session=True detaches the process
from osascript so it survives after osascript returns.

Pitfalls:
- Do NOT use nohup or & inside do-shell-script - they fail
- Do NOT use with-timeout-of-N-seconds - unreliable for long tasks
- Always write output to a log file for monitoring

## Pattern 5: Node.js with nvm

Node.js installed via nvm requires explicit PATH setup in a wrapper:

  #!/bin/bash
  export PATH=$HOME/.nvm/versions/node/v20.19.5/bin:/opt/homebrew/bin:$PATH
  cd /your/project
  node your-script.mjs

Always use a wrapper shell script rather than inline PATH in osascript.

## Pattern 6: Monitor Background Processes

Tail the log file to check progress.
Use ps -p PID to check if process is still running.

## Common Pitfalls

1. AppleScript write command loses newlines - never use for multi-line content
2. Triple double-quotes break osascript string parsing
3. Nested do-shell-script in content breaks the parser
4. Background & in do-shell-script fails silently
5. nohup in do-shell-script also fails
6. with-timeout unreliable for processes over 2 minutes
7. VM disk full affects subagents too (shared VM disk)
8. Backslash-n in heredoc content gets interpreted - use chr(10) in Python

## Decision Tree

1. Complex file content? -> Pattern 1 (base64)
2. Need to write and run a script? -> Pattern 2 (cat heredoc + python3)
3. Short simple file? -> Pattern 3 (echo-append)
4. Long-running task (>60s)? -> Pattern 4 (background subprocess)
5. Need Node.js? -> Pattern 5 (wrapper with PATH)
6. Check task progress? -> Pattern 6 (tail log + ps)
