package org.example;

import java.math.BigDecimal;

public final class AreaChecker {
    public static boolean contains(Validator.Point point) {
        BigDecimal x = point.x(), y = point.y(), r = point.r();

        boolean circle = x.signum() <= 0
                && y.signum() >= 0
                && x.multiply(x).add(y.multiply(y)).compareTo(r.multiply(r)) <= 0;

        boolean triangle = x.signum() >= 0
                && y.signum() >= 0
                && x.add(y).compareTo(r) <= 0;

        boolean square = x.signum() >= 0
                && x.compareTo(r) <= 0
                && y.signum() <= 0
                && y.compareTo(r.negate()) >= 0;

        return circle || triangle || square;
    }
}
