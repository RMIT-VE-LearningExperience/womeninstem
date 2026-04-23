# Firebase Firestore Setup Instructions

## Current Status
✅ Firebase is already configured in the game with your credentials
✅ Code is ready to save and load feedback from Firestore

## What You Need to Do

### 1. Set Up Firestore Security Rules

Your Firestore database needs security rules to allow testers to submit and view feedback.

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: **feedback-form-6714d**
3. In the left menu, click on **Firestore Database**
4. Click on the **Rules** tab at the top
5. Replace the existing rules with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read feedback (so testers can see all feedback)
    match /feedback/{feedbackId} {
      allow read: if true;

      // Allow anyone to create new feedback
      allow create: if true;

      // Don't allow updates or deletes (feedback is permanent)
      allow update, delete: if false;
    }
  }
}
```

6. Click **Publish** to save the rules

### 2. Test the Integration

1. Open `construction-planner-game.html` in a browser
2. Click the "Give Feedback" button
3. Fill out the form and submit
4. Go back to Firebase Console → Firestore Database → Data tab
5. You should see a new collection called `feedback` with your submission

### 3. View All Feedback

**In the Game:**
- Click "Give Feedback" button
- Switch to "View All Feedback" tab
- You'll see all feedback from all testers

**In Firebase Console:**
- Go to Firestore Database → Data tab
- Click on the `feedback` collection
- All feedback entries are stored here

**Export as JSON:**
- Click "Give Feedback" → "View All Feedback" tab
- Click "Export All Feedback (JSON)" button
- Downloads a JSON file with all feedback

## How It Works

- **Online:** Feedback saves to Firebase Firestore (centralized, all testers share)
- **Offline/Error:** Falls back to localStorage (browser-only, backup)
- **Loading:** Reads from Firebase first, falls back to localStorage if needed

## Data Structure

Each feedback entry contains:
- `name`: Tester's name (or "Anonymous")
- `email`: Tester's email (optional)
- `type`: "bug", "suggestion", or "general"
- `text`: The feedback message
- `timestamp`: ISO 8601 timestamp
- `date`: Human-readable date/time
- `userAgent`: Browser information (for debugging)

## Security Notes

✅ **Safe to include in public HTML:**
- Your Firebase config (apiKey, projectId, etc.) is meant to be public
- Security is controlled by Firestore rules, not by hiding the config

✅ **Current rules allow:**
- Anyone can submit feedback (create)
- Anyone can read all feedback (read)
- No one can edit or delete feedback (update/delete disabled)

⚠️ **Consider later:**
- If you want to restrict access, you can add Firebase Authentication
- If you need admin access to delete feedback, create separate admin rules

## Troubleshooting

**Feedback not saving?**
1. Check browser console (F12) for errors
2. Verify Firestore rules are published
3. Make sure you're online

**"Permission denied" error?**
- Double-check the security rules were published correctly

**Feedback only shows in my browser?**
- This means it's using localStorage fallback
- Check if Firebase is connected (see browser console)
- Verify your Firebase project is active

## Support

If you need help, check:
- Browser console (F12) for error messages
- Firebase Console → Firestore → Usage tab to see if data is being written
- The feedback count badge on the button (should show total from Firebase)
