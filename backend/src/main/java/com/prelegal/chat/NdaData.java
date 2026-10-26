package com.prelegal.chat;

/** Fields of the Mutual NDA cover page; mirrors {@code NdaData} in frontend/src/lib/nda.ts. */
public record NdaData(
        String purpose,
        String effectiveDate,
        String mndaTerm,
        int mndaTermYears,
        String confidentialityTerm,
        int confidentialityYears,
        String governingLaw,
        String jurisdiction,
        String modifications,
        Party party1,
        Party party2) {

    /** One signing party of the NDA. */
    public record Party(String name, String title, String company, String noticeAddress) {
    }
}
