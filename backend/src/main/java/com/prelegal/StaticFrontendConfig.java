package com.prelegal;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the statically exported Next.js frontend. Each route is exported as
 * {@code <route>/index.html}, so a directory request falls back to its index file.
 */
@Configuration
public class StaticFrontendConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new IndexFallbackResolver());
    }

    private static class IndexFallbackResolver extends PathResourceResolver {

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource resource = super.getResource(resourcePath, location);
            if (resource != null) {
                return resource;
            }
            String directory = resourcePath.isEmpty() || resourcePath.endsWith("/") ? resourcePath : resourcePath + "/";
            return super.getResource(directory + "index.html", location);
        }
    }
}
