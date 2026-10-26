package com.prelegal.chat;

import static com.prelegal.chat.DocumentChatServiceTests.EMPTY_DOCUMENT;
import static com.prelegal.chat.DocumentChatServiceTests.EMPTY_PARTY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerTests {

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private DocumentChatService service;

    @Test
    void returnsReplyAndUpdatedDocument() {
        Document updated = new Document("mutual-nda", EMPTY_PARTY, EMPTY_PARTY,
                List.of(new Document.Term("governingLaw", "Delaware")));
        given(service.reply(any())).willReturn(new ChatResponse("Noted: Delaware law.", updated));

        assertThat(mvc.post().uri("/api/chat").with(user("ada@example.com")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("""
                {"messages":[{"role":"user","text":"An NDA under Delaware law"}],
                 "document":{"type":"","terms":[],
                             "party1":{"name":"","title":"","company":"","noticeAddress":""},
                             "party2":{"name":"","title":"","company":"","noticeAddress":""}}}
                """))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("""
                        {"reply":"Noted: Delaware law.",
                         "document":{"type":"mutual-nda","terms":[{"key":"governingLaw","value":"Delaware"}]}}
                        """);

        ArgumentCaptor<ChatRequest> request = ArgumentCaptor.forClass(ChatRequest.class);
        verify(service).reply(request.capture());
        assertThat(request.getValue().messages()).containsExactly(new ChatMessage("user", "An NDA under Delaware law"));
        assertThat(request.getValue().document()).isEqualTo(EMPTY_DOCUMENT);
    }

    @Test
    void requiresASignedInUser() {
        assertThat(mvc.post().uri("/api/chat").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
