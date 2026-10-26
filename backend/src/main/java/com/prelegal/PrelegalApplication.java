package com.prelegal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point of the Prelegal backend, which also serves the static frontend. */
@SpringBootApplication
public class PrelegalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrelegalApplication.class, args);
    }
}
