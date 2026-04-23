# AI Profile Assistant Setup Guide

## Overview
The **AI Profile Assistant** helps applicants and employers refine their profiles with intelligent, personalized suggestions. The feature requires an OpenAI API key to function.

## Current Status

### ✅ Frontend (Already Implemented)
- **Fallback Fallback Suggestions**: When the AI service is unavailable, the system automatically displays actionable improvement tips for:
  - Profile Summary
  - Key Skills
  - Education
  - Desired Job
- **Improved UI**: Suggestions are now displayed with color-coded sections for better readability and visual hierarchy

### ⚠️ Backend (Requires Configuration)
The backend uses OpenAI's GPT API to generate personalized profile improvement suggestions. The service currently requires:
1. **OpenAI API Key** — to authenticate requests to OpenAI
2. (Optional) Custom OpenAI base URL and model selection

## Setup Instructions

### Step 1: Get an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Copy the key (keep it secure — never commit to Git)

### Step 2: Configure the Backend

#### Option A: Environment Variable (Recommended)
Set the `OPENAI_API_KEY` environment variable before starting the backend:

**PowerShell (Windows):**
```powershell
$env:OPENAI_API_KEY = "sk-your-api-key-here"
cd backend/dashboard-service
mvn spring-boot:run
```

**Bash (Linux/Mac):**
```bash
export OPENAI_API_KEY="sk-your-api-key-here"
cd backend/dashboard-service
mvn spring-boot:run
```

**Production (Linux with systemd):**
Add to your systemd service file or shell script:
```bash
export OPENAI_API_KEY="sk-your-api-key-here"
java -jar JobPortal-0.0.1-SNAPSHOT.jar
```

#### Option B: Update application.properties
Edit `backend/dashboard-service/src/main/resources/application.properties`:
```properties
openai.api.key=sk-your-api-key-here
openai.model=gpt-4o-mini
openai.max-tokens=350
```

⚠️ **Security Warning**: Never commit API keys to Git. Use `.gitignore` or environment variables instead.

### Step 3: Verify Configuration
Once configured, restart the backend:
```bash
curl http://localhost:8080/api/ahrm/v3/jobs/getAll
# Should return: 200 OK (confirms backend is running)
```

Try the profile assistant:
1. Open http://localhost:5175/ (or production URL)
2. Log in as an applicant
3. Navigate to **Profile** → **AI Profile Copilot**
4. Type a question and click **Send to CPT**

### Expected Behavior

#### ✅ When Configured & Working
- AI responds with personalized suggestions
- Suggestions appear in the chat interface
- Response takes 5-15 seconds (depends on API latency)

#### ⚠️ When Not Configured
- AI returns an error
- **Fallback suggestions automatically appear** with instant improvement tips for:
  - Profile Summary (how to structure it)
  - Key Skills (which to prioritize)
  - Education (format guidelines)
  - Desired Job (preferences to set)
- User can still improve their profile using these tips

## Configuration Details

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | (none) | **Required** — OpenAI API authentication key |
| `openai.base-url` | `https://api.openai.com/v1/chat/completions` | OpenAI API endpoint |
| `openai.model` | `gpt-4o-mini` | Model to use (lite version for cost savings) |
| `openai.max-tokens` | `350` | Max tokens per response (keep short for performance) |

### Timeouts
- **API Call Timeout**: 45 seconds (total wait before failing over to fallback suggestions)
- **Retry Logic**: 2 retries with 12-second timeout each
- **Frontend Timeout**: 12 seconds per attempt

## Troubleshooting

### Issue: "Profile assistant could not respond right now"
**Cause**: OpenAI API key not set or invalid  
**Solution**: 
1. Verify `OPENAI_API_KEY` environment variable is set:
   ```bash
   echo $OPENAI_API_KEY  # Linux/Mac
   $env:OPENAI_API_KEY  # PowerShell
   ```
2. Check backend logs for error: `grep -i "openai" backend/dashboard-service/*.log`
3. Restart backend after setting the key

### Issue: Fallback suggestions not appearing
**Cause**: Frontend not updated or JavaScript error  
**Solution**:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Check browser console for errors: `F12` → **Console** tab

### Issue: API Key looks correct but still failing
**Cause**: 
- OpenAI account has insufficient credits
- Key has been revoked or rotated
- Network/firewall blocking OpenAI endpoints
  
**Solution**:
1. Test the API key directly: Use OpenAI's [API tester](https://platform.openai.com/playground)
2. Check API usage/billing: https://platform.openai.com/account/billing/overview
3. Ensure backend can reach `api.openai.com` (may need firewall rules)

## Fallback Behavior

The profile assistant gracefully degrades when AI is unavailable:

```
User sends message
  ↓
Backend tries to call OpenAI API (45s timeout + retries)
  ↓
  ├─ ✅ Success? → Show AI response
  │
  └─ ❌ Fails? → Show intelligent fallback suggestions:
       - Profile Summary tips
       - Key Skills tips
       - Education tips
       - Desired Job tips
```

This ensures users can always get profile improvement help, even if AI is temporarily down.

## Cost Considerations
- **Model**: `gpt-4o-mini` (~$0.00015 per 1K input tokens, $0.0006 per 1K output tokens)
- **Average Cost per Request**: ~$0.001–$0.002 (very low)
- **Recommendations**: 
  - Monitor usage: https://platform.openai.com/account/billing/overview
  - Set usage limits to avoid surprises
  - Consider rate limiting if scaling to many users

## Next Steps
1. ✅ Obtain OpenAI API key
2. ✅ Set `OPENAI_API_KEY` environment variable
3. ✅ Restart backend
4. ✅ Test in frontend at http://localhost:5175/
5. ✅ (Optional) Deploy to production with the same environment variable

