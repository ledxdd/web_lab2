package org.example;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;

public final class RequestHandler {
    public record Response(int status, String cookie, String json) {}
    private final HistoryStore history = new HistoryStore();

    public Response handle(Properties env, InputStream input, long started) throws IOException {
        String method = env.getProperty("REQUEST_METHOD", "");
        String query = env.getProperty("QUERY_STRING", "");

        if (!method.equals("POST")) {
            return error(405, "Для этого запроса используйте POST.");
        }

        try {
            String session;

            if (query.equals("action=history")) {
                session = history.session(env.getProperty("HTTP_COOKIE", ""));
            } else {
                int length = Integer.parseInt(env.getProperty("CONTENT_LENGTH", "0"));
                byte[] bytes = input.readNBytes(length);

                String body = new String(bytes, StandardCharsets.UTF_8);

                if (query.equals("action=clear")) {
                    session = history.session(env.getProperty("HTTP_COOKIE", ""));
                    history.results(session).clear();
                } else {
                    Validator.Point point = Validator.validate(parseForm(body));
                    boolean hit = AreaChecker.contains(point);

                    session = history.session(env.getProperty("HTTP_COOKIE", ""));
                    history.results(session).add(new CheckResult(point, hit, Instant.now().toString(),
                            System.nanoTime() - started));
                }
            }

            String rows = history.results(session).stream().map(CheckResult::toJson).collect(Collectors.joining(","));

            return new Response(200, session,
                       "{" +
                            "\"results\":[" + rows + "]," +
                            "\"serverTime\":\"" + Instant.now() +
                            "\",\"elapsedNanos\":" + (System.nanoTime() - started) +
                            "}");

        } catch (IllegalArgumentException exception) {
            return error(400, "Некорректные параметры " + exception.getMessage());
        }
    }

    static Map<String, String> parseForm(String body) {
        Map<String, String> values = new HashMap<>();

        for (String field : body.split("&", -1)) {
            String[] pair = field.split("=", 2);

            String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8);
            String value = URLDecoder.decode(pair.length == 2 ? pair[1] : "", StandardCharsets.UTF_8);

            values.put(key, value);
        }
        return values;
    }

    static Response error(int status, String message) {
        String safe = message
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replaceAll("[\\x00-\\x1f]", " ");

        return new Response(status, null,
                "{" +
                "\"error\":\"" + safe + "\"," +
                "\"serverTime\":\"" + Instant.now() + "\"" +
                "}");
    }
}
