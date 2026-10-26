package com.prelegal.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.genai.Client;
import com.google.genai.errors.ServerException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class GeminiConfigTests {

    @Test
    void failsFastWithoutRetryingWhenGeminiIsOverloaded() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> {
            requests.incrementAndGet();
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });
        server.start();
        try {
            String baseUrl = "http://localhost:" + server.getAddress().getPort();
            Client client = Client.builder()
                    .apiKey("test-key")
                    .httpOptions(GeminiConfig.HTTP_OPTIONS.toBuilder().baseUrl(baseUrl).build())
                    .build();

            assertThatThrownBy(() -> client.models.generateContent("gemini-3.8-flash", "Hi", null))
                    .isInstanceOf(ServerException.class);
            assertThat(requests).hasValue(1);
        } finally {
            server.stop(0);
        }
    }
}
