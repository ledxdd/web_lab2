package org.example;

public record CheckResult(Validator.Point point, boolean hit, String time, long elapsedNanos) {

    public String toJson() {
        return "{" +
                "\"x\":\"" + point.x().toPlainString() +
                "\",\"y\":\"" + point.y().toPlainString() +
                "\",\"r\":\"" + point.r().toPlainString() +
                "\",\"hit\":" + hit +
                ",\"time\":\"" + time +
                "\",\"elapsedNanos\":" + elapsedNanos +
                "}";
    }
}
