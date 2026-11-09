package org.example;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class HistoryStore {
    private final Map<String, List<CheckResult>> sessions = new HashMap<>();

    public String session(String cookie) {
        for (String part : cookie.split(";")) {
            String[] pair = part.trim().split("=", 2);

            if (pair.length == 2 && pair[0].equals("LAB_SESSION") && sessions.containsKey(pair[1])) {
                return pair[1];
            }
        }

        String id = UUID.randomUUID().toString();
        sessions.put(id, new ArrayList<>());

        return id;
    }

    public List<CheckResult> results(String id) {
        return sessions.get(id);
    }
}
