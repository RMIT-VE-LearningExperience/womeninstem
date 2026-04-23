# WIS Career Dashboard - Setup Instructions

## Overview

The WIS Career Dashboard is a web-based tool for managing career data in the `wis.json` file. It uses GitHub's API to read and write data directly to the repository, ensuring all changes are version-controlled.

## One-Time Setup (Per Team Member)

### Step 1: Generate GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Navigate to: [https://github.com/settings/tokens](https://github.com/settings/tokens)
   - Or: Click your profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click **"Generate new token (classic)"**
   - Note: `WIS Career Dashboard`
   - Expiration: `90 days` (or choose custom duration)

3. **Select Scopes:**
   - Check **✓ repo** (Full control of private repositories)
   - This is the only scope needed

4. **Generate and Copy:**
   - Click **"Generate token"** at the bottom
   - **IMPORTANT:** Copy the token immediately - you won't be able to see it again!
   - It should start with `ghp_`

### Step 2: Access the Dashboard

1. **Navigate to the Dashboard:**
   - URL: [https://rmit-ve-learningexperience.github.io/dmd/wis_demo/admin.html](https://rmit-ve-learningexperience.github.io/dmd/wis_demo/admin.html)

2. **Paste Your Token:**
   - On first visit, you'll see a setup screen
   - Paste your GitHub token into the input field
   - Click **"Save Token"**

3. **Verification:**
   - The dashboard will verify your token with GitHub
   - If successful, you'll see the career management interface
   - If there's an error, check that:
     - Token is correct (starts with `ghp_`)
     - Token has `repo` scope
     - Token hasn't expired

### Step 3: You're Ready!

- Your token is stored securely in your browser's local storage
- You can now view, edit, add, and delete careers
- All changes are committed directly to GitHub

---

## Using the Dashboard

### Viewing Careers

- The dashboard displays all careers in a table format
- Use the **search box** to filter careers by name, work style, or overview
- You can see:
  - Career name
  - Salary range
  - Work style (e.g., "Hands-on-Analytical")
  - Number of career levels
  - Number of core skills

### Adding a New Career

1. Click **"+ Add New Career"** button
2. Fill in all required fields (marked with *):
   - **Career Name:** Unique name for the career
   - **Salary Range:** Format: `$XX,XXX - $XX,XXX`
   - **Overview:** 1-2 sentence description
   - **Work Style:** Select from dropdown
   - **Core Skills:** Add skills one at a time (press Enter after each)
   - **Core Education:** Add education requirements (press Enter after each)
   - **Related Roles:** Optional - select from existing careers
   - **Career Levels:** Add at least 2 levels
3. Click **"Save to GitHub"**
4. Changes are committed automatically

### Editing a Career

1. Click **"Edit"** button next to the career you want to modify
2. The edit panel will slide in from the right
3. Make your changes
4. Click **"Save to GitHub"**
5. The dashboard will:
   - Validate your changes
   - Commit to GitHub with a descriptive message
   - Refresh the career list

### Deleting a Career

1. Click **"Delete"** button next to the career
2. Confirm the deletion in the popup
3. Click **"Save to GitHub"** (if you've made other changes)
4. **Note:** Deletion is immediate and cannot be undone (except via Git history)

### Career Levels

Each career must have **at least 2 levels**. For each level, you can specify:

- **Title:** Level name (e.g., "Junior Electrician", "Senior Electrician")
- **Summary:** Description of this level
- **Typical Experience:** How long someone typically stays at this level
- **Progresses To:** Comma-separated list of level titles this level can advance to
- **Related Roles:** Comma-separated list of related career names

**Example:**
- Title: `Junior Electrician`
- Progresses To: `Senior Electrician, Lead Electrician`
- Related Roles: `Plumber, HVAC Technician`

---

## Validation Rules

The dashboard enforces these rules before saving:

### Required Fields
- Career name
- Salary range (format: `$XX,XXX - $XX,XXX`)
- Overview
- Work style
- At least 1 core skill
- At least 1 education requirement
- At least 2 career levels
- Each level must have a title and summary

### Format Validation
- **Salary Range:** Must match pattern `$XX,XXX - $XX,XXX`
  - ✓ Valid: `$50,000 - $80,000`
  - ✗ Invalid: `50000-80000`, `$50k - $80k`

### Uniqueness
- Career names must be unique
- Cannot have duplicate career names in the system

### Cross-References
- Related roles must reference existing careers
- Level "progresses to" should reference valid level titles (warning only)

---

## Security

### Token Security
- **Never share your personal access token**
- Token is stored only in your browser's local storage
- Token is never sent anywhere except GitHub's API
- If compromised, revoke it immediately at [GitHub Settings](https://github.com/settings/tokens)

### Token Expiration
- Tokens expire after the duration you set (e.g., 90 days)
- When expired, you'll see an "Invalid token" error
- Generate a new token and paste it in the setup screen

### Logout
- Click **"Logout"** in the top-right to clear your token from the browser
- You'll need to paste your token again next time
- Use this on shared computers

---

## Troubleshooting

### "Invalid token" Error

**Possible causes:**
- Token expired
- Token doesn't have `repo` scope
- Typo when pasting token

**Solution:**
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Delete old token
3. Generate new token with `repo` scope
4. Copy and paste new token in dashboard

### "Failed to load career data" Error

**Possible causes:**
- Network connection issue
- GitHub API rate limit exceeded
- Repository permissions changed

**Solution:**
1. Check your internet connection
2. Wait a few minutes and try again
3. Verify you have access to the repository

### Changes Not Appearing

**Possible causes:**
- Browser cache showing old version
- Concurrent edits by another team member

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check [GitHub commits](https://github.com/RMIT-VE-LearningExperience/dmd/commits/main) to verify your change
3. If conflict, coordinate with team member

### Can't Save Changes

**Possible causes:**
- Validation errors
- Missing required fields
- Network error

**Solution:**
1. Scroll up to see validation error messages (red box)
2. Fix all errors listed
3. Ensure all required fields (marked with *) are filled
4. Try saving again

### Validation Errors

The dashboard will show a red box with specific errors. Common ones:

- `"Salary must be in format: $XX,XXX - $XX,XXX"` → Fix salary format
- `"At least one core skill is required"` → Add at least 1 skill
- `"At least 2 career levels are required"` → Add more levels
- `"Career name already exists"` → Choose a different name

---

## Best Practices

### Before Making Changes
1. **Communicate with team:** Let others know you're editing
2. **Pull latest changes:** Refresh the page to see recent updates
3. **Make small, focused changes:** Edit one career at a time

### When Editing
1. **Use clear, descriptive names:** Avoid abbreviations
2. **Follow existing patterns:** Match format of other careers
3. **Double-check salary ranges:** Ensure realistic and properly formatted
4. **Keep overviews concise:** 1-2 sentences, focus on key information
5. **Use consistent skill names:** Check existing skills before adding new ones

### After Saving
1. **Verify the commit:** Check [GitHub commits](https://github.com/RMIT-VE-LearningExperience/dmd/commits/main)
2. **Test on live site:** Visit careers explorer to see changes
3. **Hard refresh if needed:** `Ctrl+Shift+R` to clear cache

---

## Workflow for Monthly Updates

### Recommended Process

1. **Review planned changes:**
   - List careers to add/edit/delete
   - Gather all required information

2. **Coordinate with team:**
   - Check if anyone else is editing
   - Decide who makes which changes

3. **Make changes:**
   - Open dashboard
   - Edit one career at a time
   - Save after each career (creates separate commits)

4. **Verify changes:**
   - Check GitHub for commits
   - Test careers explorer page
   - Verify quiz still works with new data

5. **Document changes:**
   - Optional: Add summary of changes in team chat
   - Note any new skills or work styles added

---

## Technical Details

### How It Works

1. **Authentication:** Uses GitHub Personal Access Token for API access
2. **Data Storage:** `wis.json` file in `wis_demo/` directory
3. **Commits:** Each save creates a Git commit with timestamp
4. **Format:** JSON file with schema validation
5. **Deployment:** GitHub Pages auto-deploys changes within 1-2 minutes

### Commit Messages

The dashboard generates commit messages like:
- `Added career: Structural Engineer`
- `Updated career: Quantity Surveyor`

You can see all changes at:
[https://github.com/RMIT-VE-LearningExperience/dmd/commits/main](https://github.com/RMIT-VE-LearningExperience/dmd/commits/main)

### Git History

All changes are version-controlled. To revert a change:
1. Find the commit on GitHub
2. Click "Revert" button
3. Create pull request or direct commit

---

## Support

### Questions or Issues?

- **Technical issues:** Check this README first
- **Data questions:** Coordinate with team lead
- **Feature requests:** Document in team notes

### Emergency Rollback

If something breaks:
1. Go to [GitHub wis.json file](https://github.com/RMIT-VE-LearningExperience/dmd/blob/main/wis_demo/wis.json)
2. Click "History"
3. Find last good version
4. Click "Revert this commit"

---

## Quick Reference

| Task | Action |
|------|--------|
| **Generate Token** | [GitHub Settings → Tokens](https://github.com/settings/tokens) |
| **Access Dashboard** | [Admin Dashboard](https://rmit-ve-learningexperience.github.io/dmd/wis_demo/admin.html) |
| **View Commits** | [GitHub Commits](https://github.com/RMIT-VE-LearningExperience/dmd/commits/main) |
| **View JSON File** | [wis.json](https://github.com/RMIT-VE-LearningExperience/dmd/blob/main/wis_demo/wis.json) |
| **Careers Explorer** | [Live Site](https://rmit-ve-learningexperience.github.io/dmd/wis_demo/career-explorer.html) |

---

**Last Updated:** 2026-01-30
**Version:** 1.0
