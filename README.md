# **ZenFocus - AI-Powered Productivity Flow State**

#   

# 

> Assignment Category: Logic & Interaction Heavy 
> 
> Live Deployment: 
> 
> [https://gemini.google.com/share/4161c2bd5e1a](https://gemini.google.com/share/4161c2bd5e1a)
> 
> GitHub Repository: 
> 
> [https://github.com/abdaahads/ZenFocus-App](https://github.com/abdaahads/ZenFocus-App)

>   

  

## 💡 What & Why

# 

ZenFocus is a "Cyber-Minimalist" productivity dashboard designed to help users enter a deep "flow state."

I built this because standard timer apps are too rigid and to-do lists are too cluttered. ZenFocus combines both into a single, fluid interface. It uses Google's Gemini AI to act as an intelligent accountability partner—breaking down overwhelming tasks into small steps and offering Stoic wisdom when you procrastinate.

  

## 🛠️ Tech Stack & Tools Used

# 

*   Core Stack: React (Vite), Tailwind CSS, TypeScript.
    
*   AI Intelligence: Google Gemini API (via `generativelanguage` endpoint).
    
*   Icons: Lucide React.
    
*   Storage: Browser LocalStorage (Custom hook with corruption protection).
    
*   AI Tools Used: Gemini (acting as Senior Frontend Dev/CTO).
    
      
    

## 🤖 The Prompting Process

### The "Golden Prompt" That Worked

# 

The most effective prompt used the Role-Context-Task-Constraints framework to generate the core application in a single shot:

> Role: Act as a Senior Frontend Developer and UI/UX Designer.
> 
> Task: Build a single-file React application called "ZenFocus".
> 
> Context: Logic & Interaction Heavy productivity dashboard. Aesthetic: "Cyber-Minimalist" (deep slate, emerald/cyan neon, glassmorphism).
> 
> Features: Smart Timer (breathing visuals), Task Stream (LocalStorage), AI Smart Breakdown (Gemini), Zen Mode (full-screen overlay).
> 
> Constraints:Use `import.meta.env` for keys, handle data corruption gracefully, ensure mobile responsiveness.

###   

### What I Learned About Prompting

# 

1.  Vibe over Specs: Describing the *feeling* of the app ("breathing glow", "cyber-minimalist") resulted in much better CSS animations than trying to write the keyframes myself.
    
2.  Constraint Injection: Explicitly telling the AI to "handle data corruption gracefully" saved me from potential white-screen crashes later.
    
3.  Iterative Refinement: I learned that AI struggles with dual-environment configurations (Preview vs. Production). It's better to get it working in one environment first, then refactor for deployment.
    

##   

## 🐛 Challenges & "What Didn't Work"

# 

1\. The "White Screen of Death"

*   Problem: The app crashed immediately upon loading for some users.
    
*   Cause: The app tried to read old/corrupted data from `localStorage` that didn't match the new TypeScript interfaces.
    
*   Fix: We implemented a "Corruption Guard" in the `useLocalStorage` hook that explicitly checks for `null` or invalid JSON and resets the data to a safe default if detected.
    

  

2\. The Vercel vs. Preview Environment War

*   Problem: The code couldn't decide whether to use `import.meta.env` (Vercel) or a hardcoded key (Preview), causing build errors.
    
*     
    
    Fix: We simplified the code to use a standard variable for the preview, with clear comments on which line to uncomment for production deployment.
    

##   

## ✨ Key Features (The "Wow" Factors)

# 

1.  🧘 Zen Mode: A specialized UI state that visually removes all clutter, leaving only the breathing timer and your single active task.
    
2.  🧠 AI Smart Breakdown: Click the "Sparkle" icon on any vague task, and Gemini instantly breaks it down into 3-5 actionable sub-steps.
    
3.  💡 Zen Coach: A "Lightbulb" button that analyzes your specific task and gives you a single, powerful sentence of advice to get you moving.
    
4.  🔊 Procedural Audio: Minimalist sound cues generated via the Web Audio API (no heavy asset downloads).
    

##   

## 📦 Local Setup Instructions

# 

1.  Clone the repository
    
    ```
    git clone [your-repo-link]
    cd zenfocus
    ```
    
2.    
    
    Install Dependencies
    
    ```
    npm install
    ```
    
3.    
    
    Configure API Key
    
    *   Get a free key from [Google AI Studio](https://aistudio.google.com/ "null").
        
    *   Create a `.env` file in the root directory:
        
        ```
        VITE_GEMINI_API_KEY=your_actual_api_key_here
        ```
        
4.    
    
    Run Locally
    
    ```
    npm run dev
    ```
    

## 🚀 Deployment (Vercel)

# 

1.  Push code to GitHub.
    
2.  Import project to Vercel.
    
3.    
    
    CRITICAL: In Vercel Project Settings > Environment Variables, add:
    
    *   Key: `VITE_GEMINI_API_KEY`
        
    *   Value: `[Your Google API Key]`
        
4.  Deploy!
    
      
    

*Built for the Vibe Coding Assignment 2025.*