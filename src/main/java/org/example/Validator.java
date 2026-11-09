package org.example;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

public final class Validator {
    public record Point(BigDecimal x, BigDecimal y, BigDecimal r) {}

    public static Point validate(Map<String, String> values) {
        BigDecimal x = decimal(values.get("x"));
        BigDecimal y = decimal(values.get("y"));
        BigDecimal r = decimal(values.get("r"));

        if (x.stripTrailingZeros().scale() > 0 || x.compareTo(new BigDecimal("-5")) < 0
                || x.compareTo(new BigDecimal("3")) > 0) {
            throw new IllegalArgumentException("X должен быть целым числом от −5 до 3.");
        }

        if (y.compareTo(new BigDecimal("-5")) <= 0 || y.compareTo(new BigDecimal("3")) >= 0) {
            throw new IllegalArgumentException("Y должен быть строго больше −5 и меньше 3.");
        }

        if (!Set.of("1", "1.5", "2", "2.5", "3").contains(r.stripTrailingZeros().toPlainString())) {
            throw new IllegalArgumentException("Выберите R: 1, 1.5, 2, 2.5 или 3.");
        }

        return new Point(x, y, r);
    }

    private static BigDecimal decimal(String value) {
        String text = value == null ? "" : value.trim().replace(',', '.');

        if (!text.matches("-?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)")) {
            throw new IllegalArgumentException("Укажите все координаты и радиус обычными десятичными числами.");
        }

        return new BigDecimal(text);
    }
}
