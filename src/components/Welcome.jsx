import React from "react";
import GoogleSignin from "../img/btn_google_signin_dark_pressed_web.png";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const Welcome = () => {
    
    const googleSignIn = () => {
        console.log("Starting Google Sign In process...");
        const provider = new GoogleAuthProvider();
        
        // Log the current window location
        console.log("Current window location:", window.location.href);
        
        // Log provider settings
        console.log("Provider settings:", {
            providerId: provider.providerId,
            customParameters: provider.customParameters,
        });
        
        // Log Firebase auth configuration
        console.log("Firebase Auth Configuration:", {
            auth: auth,
            currentUser: auth.currentUser,
            authDomain: auth.config.authDomain,
            apiKey: auth.config.apiKey,
            projectId: auth.config.projectId
        });

        // Using signInWithPopup instead of signInWithRedirect
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Sign in successful:", result);
                const user = result.user;
                console.log("User details:", user);
            })
            .catch((error) => {
                console.error("Sign in error:", {
                    errorCode: error.code,
                    errorMessage: error.message,
                    email: error.email,
                    credential: error.credential,
                    stack: error.stack
                });
            });
    };

  return (
    <main className="welcome">
      <h2>Welcome to React Chat.</h2>
      <img src="/logo512.png" alt="ReactJs logo" width={50} height={50} />
      <p>Sign in with Google to chat with with your fellow React Developers.</p>
      <button className="sign-in">
        <img
          onClick={googleSignIn}
          src={GoogleSignin}
          alt="sign in with google"
          type="button"
        />
      </button>
    </main>
  );
};
export default Welcome;