# Using Act to Test GitHub Actions Locally

1. Install Act:
   - On macOS with Homebrew: `brew install act`
   - Chose the Midium alternative
   - On other systems: Visit https://github.com/nektos/act for installation instructions

2. Ensure Docker is installed and running on your system.

3. Navigate to your project root in the terminal.

4. Run the following command to simulate a pull request event:
   ```
   act pull_request
   ```

5. To run a specific job:
   ```
   act -j build-and-test
   ```

6. To list all available actions without running them:
   ```
   act -l
   ```

7. If you need to provide secrets:
   - Create a file named `.secrets` in your project root
   - Add secrets in the format `MY_SECRET=value`
   - Run Act with: `act --secret-file .secrets`

Remember to add `.secrets` to your `.gitignore` file to avoid committing sensitive information.

Note: Act might not perfectly replicate the GitHub Actions environment, especially for complex workflows or those using GitHub-specific features.