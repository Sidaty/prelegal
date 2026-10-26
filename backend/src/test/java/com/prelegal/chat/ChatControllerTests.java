package com.prelegal.chat;

import static com.prelegal.chat.NdaChatServiceTests.EMPTY_NDA;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerTests {

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private NdaChatService service;

    @Test
    void returnsReplyAndUpdatedFields() {
        NdaData updated = new NdaData("", "", "expires", 1, "years", 1, "Delaware", "", "",
                NdaChatServiceTests.EMPTY_PARTY, NdaChatServiceTests.EMPTY_PARTY);
        given(service.reply(any())).willReturn(new ChatResponse("Noted: Delaware law.", updated));

        assertThat(mvc.post().uri("/api/chat").contentType(MediaType.APPLICATION_JSON).content("""
                {"messages":[{"role":"user","text":"Delaware law please"}],
                 "nda":{"purpose":"","effectiveDate":"","mndaTerm":"expires","mndaTermYears":1,
                        "confidentialityTerm":"years","confidentialityYears":1,"governingLaw":"",
                        "jurisdiction":"","modifications":"",
                        "party1":{"name":"","title":"","company":"","noticeAddress":""},
                        "party2":{"name":"","title":"","company":"","noticeAddress":""}}}
                """))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("{\"reply\":\"Noted: Delaware law.\",\"nda\":{\"governingLaw\":\"Delaware\"}}");

        ArgumentCaptor<ChatRequest> request = ArgumentCaptor.forClass(ChatRequest.class);
        verify(service).reply(request.capture());
        assertThat(request.getValue().messages()).containsExactly(new ChatMessage("user", "Delaware law please"));
        assertThat(request.getValue().nda()).isEqualTo(EMPTY_NDA);
    }
}
