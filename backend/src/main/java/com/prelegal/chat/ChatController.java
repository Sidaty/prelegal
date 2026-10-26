package com.prelegal.chat;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Chat endpoint that drafts a legal document from a freeform conversation. */
@RestController
public class ChatController {

    private final DocumentChatService chat;

    public ChatController(DocumentChatService chat) {
        this.chat = chat;
    }

    @PostMapping("/api/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        return chat.reply(request);
    }
}
