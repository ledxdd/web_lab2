package org.example;

import com.fastcgi.FCGIInterface;
import java.nio.charset.StandardCharsets;

public final class Main {
    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        RequestHandler handler = new RequestHandler();

        while (fcgi.FCGIaccept() >= 0) {
            long started = System.nanoTime();
            RequestHandler.Response response;

            try {
                response = handler.handle(FCGIInterface.request.params, System.in, started);
            } catch (Exception exception) {
                exception.printStackTrace(System.err);
                response = RequestHandler.error(500, "Ошибка exception вылетел при попытке обработать запрос");
            }

            byte[] body = response.json().getBytes(StandardCharsets.UTF_8);

            String headers = "Status: " + response.status() +
                    "\r\nContent-Type: application/json; charset=UTF-8\r\n" +
                    "Content-Length: " + body.length +
                    "\r\nCache-Control: no-store\r\n" +
                    (response.status() == 405 ? "Allow: POST\r\n" : "") +
                    (response.cookie() == null ? "" : "Set-Cookie: LAB_SESSION=" + response.cookie() +
                            "; Path=/; HttpOnly; SameSite=Lax\r\n") + "\r\n";

            System.out.writeBytes(headers.getBytes(StandardCharsets.UTF_8));
            System.out.writeBytes(body);
            System.out.flush();
        }
    }
}
