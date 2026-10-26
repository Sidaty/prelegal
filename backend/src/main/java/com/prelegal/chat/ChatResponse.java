package com.prelegal.chat;

/** The assistant's reply and the full, updated document fields. Also the model's structured output. */
public record ChatResponse(String reply, NdaData nda) {
}
