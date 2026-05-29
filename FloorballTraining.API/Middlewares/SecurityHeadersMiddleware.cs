namespace FloorballTraining.API.Middlewares
{
    /// <summary>
    /// Adds baseline security headers to every response. CSP is intentionally
    /// permissive on style/font/img sources so the FloTr SPA (Tailwind, inline
    /// React styles, recharts SVG, data: fonts) keeps working when served from
    /// the API; tighten further once the frontend's exact needs are confirmed.
    /// </summary>
    public class SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment environment)
    {
        private const string ContentSecurityPolicy =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'";

        public async Task InvokeAsync(HttpContext context)
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";
            headers["Content-Security-Policy"] = ContentSecurityPolicy;

            // HSTS only over HTTPS in production to avoid breaking local HTTP dev.
            if (!environment.IsDevelopment())
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            await next(context);
        }
    }
}
