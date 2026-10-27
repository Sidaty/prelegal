package com.prelegal.chat;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Gemini API client, authenticated with GEMINI_API_KEY. */
@Configuration
public class GeminiConfig {

    /**
     * One attempt only: the SDK's default retries take ~30s and burn quota; the user can resend instead.
     * Without a timeout (in milliseconds), a model that never answers blocks the chat request forever.
     */
    static final HttpOptions HTTP_OPTIONS = HttpOptions.builder()
            .retryOptions(HttpRetryOptions.builder().attempts(1))
            .timeout(60_000)
            .build();

    @Bean
    public Client geminiClient(@Value("${gemini.api-key}") String apiKey) {
        return Client.builder().apiKey(apiKey).httpOptions(HTTP_OPTIONS).build();
    }
}
