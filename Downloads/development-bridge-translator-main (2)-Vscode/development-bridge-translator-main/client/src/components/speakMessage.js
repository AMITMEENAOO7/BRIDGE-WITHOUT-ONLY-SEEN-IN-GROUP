import * as sdk from "microsoft-cognitiveservices-speech-sdk";

let player = null;
let synthesizer = null;
let isSpeaking = false; // State to track audio playback

const speakMessage = async (text, setIsSpeaking) => {
  try {
    // If already speaking, stop and reset
    if (isSpeaking) {
      if (player && player.internalAudio) {
        player.internalAudio.currentTime = player.internalAudio.duration; // Stop playback
      }
      isSpeaking = false;
      setIsSpeaking(false); // Update state in the component
      player = null;
      synthesizer = null;
      return; // Exit
    }

    // Initialize player if not already done
    if (!player) {
      player = new sdk.SpeakerAudioDestination();
      player.onAudioEnd = () => {
        console.log("Finished Speaking");
        isSpeaking = false;
        setIsSpeaking(false); // Reset the state when speech completes naturally
        player = null; // Clean up player after finishing
        synthesizer = null; // Clean up synthesizer
      };
    }

    // Configure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      "7d50303122394b1895f30959285ca290", // Azure key
      "southeastasia" // Azure region
    );
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Use speaker output
    const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);

    // Initialize synthesizer
    synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Start speaking
    synthesizer.speakTextAsync(text);
    isSpeaking = true;
    setIsSpeaking(true); // Update state to show that speaking has started

  } catch (error) {
    console.error("Error in speakMessage:", error);
    setIsSpeaking(false); // Ensure state is reset if there's an error
  }
};

export default speakMessage;