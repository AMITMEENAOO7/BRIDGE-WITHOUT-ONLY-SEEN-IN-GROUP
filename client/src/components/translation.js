const translateMessage = async (text, targetLang) => {
    const subscriptionKey = "f14a3a47b0cc403aa31da18f496d4e48";
    const region = "southeastasia";
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;

    const body = JSON.stringify([{ Text: text }]);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      return data[0].translations[0].text; // Extract translated text
    } catch (error) {
      console.error("Error translating message:", error);
      return text;
    }
};
