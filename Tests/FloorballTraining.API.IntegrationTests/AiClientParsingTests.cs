using System.Net;
using System.Text;
using FloorballTraining.API.Services.Ai;

namespace FloorballTraining.API.IntegrationTests;

/// <summary>
/// Pure parsing tests for the AI provider clients: SSE framing, per-provider stream
/// event shapes (text deltas + token usage), tolerance to missing usage, and error
/// mapping. No web host — the clients get an HttpClient with a canned handler.
/// </summary>
public class AiClientParsingTests
{
    private sealed class CannedHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
    }

    private static HttpClient Canned(string body, HttpStatusCode status = HttpStatusCode.OK)
        => new(new CannedHandler(status, body));

    private static async Task<(string Text, int Input, int Output)> Drain(IAsyncEnumerable<AiStreamEvent> events)
    {
        var text = new StringBuilder();
        var input = 0;
        var output = 0;
        await foreach (var e in events)
        {
            switch (e)
            {
                case AiTextDelta d: text.Append(d.Text); break;
                case AiUsageEvent u:
                    input = Math.Max(input, u.InputTokens);
                    output = Math.Max(output, u.OutputTokens);
                    break;
            }
        }
        return (text.ToString(), input, output);
    }

    // ── SseLineReader ────────────────────────────────────────────────────────

    [Fact]
    public async Task SseLineReader_ParsesEventsWithNamesCommentsAndMultilineData()
    {
        const string raw = ": comment to ignore\n" +
                           "event: message_start\n" +
                           "data: {\"a\":1}\n" +
                           "\n" +
                           "data: line1\n" +
                           "data: line2\n" +
                           "\n" +
                           "data: no-trailing-blank";
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(raw));

        var events = new List<SseEvent>();
        await foreach (var e in SseLineReader.ReadAsync(stream)) events.Add(e);

        events.Should().HaveCount(3);
        events[0].Should().Be(new SseEvent("message_start", "{\"a\":1}"));
        events[1].Should().Be(new SseEvent(null, "line1\nline2"));
        events[2].Should().Be(new SseEvent(null, "no-trailing-blank"));
    }

    // ── Anthropic ────────────────────────────────────────────────────────────

    private const string AnthropicSse =
        "event: message_start\n" +
        "data: {\"type\":\"message_start\",\"message\":{\"usage\":{\"input_tokens\":42}}}\n\n" +
        "event: content_block_delta\n" +
        "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"Hello \"}}\n\n" +
        "event: content_block_delta\n" +
        "data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"world\"}}\n\n" +
        "event: message_delta\n" +
        "data: {\"type\":\"message_delta\",\"usage\":{\"output_tokens\":7}}\n\n" +
        "event: message_stop\n" +
        "data: {\"type\":\"message_stop\"}\n\n";

    [Fact]
    public async Task Anthropic_Stream_YieldsTextAndSplitUsage()
    {
        var client = new AnthropicChatClient(Canned(AnthropicSse), "sk-test");
        var (text, input, output) = await Drain(
            client.StreamAsync(new AiChatRequest("sys", "usr", "claude-opus-4-8", 1000), CancellationToken.None));

        text.Should().Be("Hello world");
        input.Should().Be(42);
        output.Should().Be(7);
    }

    [Fact]
    public async Task Anthropic_Complete_ParsesTextBlocksAndUsage()
    {
        const string body = "{\"content\":[{\"type\":\"text\",\"text\":\"Answer\"}]," +
                            "\"usage\":{\"input_tokens\":10,\"output_tokens\":3}}";
        var client = new AnthropicChatClient(Canned(body), "sk-test");
        var result = await client.CompleteAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        result.Text.Should().Be("Answer");
        result.InputTokens.Should().Be(10);
        result.OutputTokens.Should().Be(3);
    }

    [Fact]
    public async Task Anthropic_CompleteWithWebSearch_IgnoresToolBlocks_AndCollectsCitationSources()
    {
        const string body = """
            {"content":[
              {"type":"server_tool_use","id":"srv_1","name":"web_search","input":{"query":"q"}},
              {"type":"web_search_tool_result","tool_use_id":"srv_1","content":[
                {"type":"web_search_result","url":"https://a.example","title":"A"}]},
              {"type":"text","text":"Answer","citations":[
                {"type":"web_search_result_location","url":"https://a.example","title":"A"},
                {"type":"web_search_result_location","url":"https://b.example","title":"B"}]}
            ],"usage":{"input_tokens":50,"output_tokens":20}}
            """;
        var client = new AnthropicChatClient(Canned(body), "sk-test");
        var result = await client.CompleteWithWebSearchAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        result.Text.Should().Be("Answer");
        result.InputTokens.Should().Be(50);
        result.OutputTokens.Should().Be(20);
        result.Sources.Should().HaveCount(2);
        result.Sources.Should().Contain(s => s.Url == "https://a.example" && s.Title == "A");
        result.Sources.Should().Contain(s => s.Url == "https://b.example" && s.Title == "B");
    }

    [Fact]
    public async Task Anthropic_Unauthorized_ThrowsInvalidKey()
    {
        var client = new AnthropicChatClient(Canned("{\"error\":\"nope\"}", HttpStatusCode.Unauthorized), "bad");
        var act = () => client.CompleteAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.ErrorType.Should().Be("InvalidKey");
    }

    // ── OpenAI ───────────────────────────────────────────────────────────────

    private const string OpenAiSse =
        "data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n" +
        "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n" +
        "data: {\"choices\":[{\"delta\":{}}]}\n\n" +
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":15,\"completion_tokens\":4}}\n\n" +
        "data: [DONE]\n\n";

    [Fact]
    public async Task OpenAi_Stream_YieldsTextAndFinalUsage()
    {
        var client = new OpenAiChatClient(Canned(OpenAiSse), "sk-test");
        var (text, input, output) = await Drain(
            client.StreamAsync(new AiChatRequest("sys", "usr", "gpt-4o", 1000), CancellationToken.None));

        text.Should().Be("Hello");
        input.Should().Be(15);
        output.Should().Be(4);
    }

    [Fact]
    public async Task OpenAi_Stream_MissingUsage_StillYieldsText()
    {
        const string sse = "data: {\"choices\":[{\"delta\":{\"content\":\"x\"}}]}\n\ndata: [DONE]\n\n";
        var client = new OpenAiChatClient(Canned(sse), "sk-test");
        var (text, input, output) = await Drain(
            client.StreamAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None));

        text.Should().Be("x");
        input.Should().Be(0);
        output.Should().Be(0);
    }

    // ── Gemini ───────────────────────────────────────────────────────────────

    private const string GeminiSse =
        "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Ahoj \"}]}}]," +
        "\"usageMetadata\":{\"promptTokenCount\":20,\"candidatesTokenCount\":1}}\n\n" +
        "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"svete\"}]}}]," +
        "\"usageMetadata\":{\"promptTokenCount\":20,\"candidatesTokenCount\":5}}\n\n";

    [Fact]
    public async Task Gemini_Stream_YieldsTextAndCumulativeUsage()
    {
        var client = new GeminiChatClient(Canned(GeminiSse), "key");
        var (text, input, output) = await Drain(
            client.StreamAsync(new AiChatRequest("sys", "usr", "gemini-2.0-flash", 1000), CancellationToken.None));

        text.Should().Be("Ahoj svete");
        input.Should().Be(20);
        output.Should().Be(5); // last cumulative report wins
    }

    [Fact]
    public async Task Gemini_Complete_ParsesParts()
    {
        const string body = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"A\"},{\"text\":\"B\"}]}}]," +
                            "\"usageMetadata\":{\"promptTokenCount\":9,\"candidatesTokenCount\":2}}";
        var client = new GeminiChatClient(Canned(body), "key");
        var result = await client.CompleteAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        result.Text.Should().Be("AB");
        result.InputTokens.Should().Be(9);
        result.OutputTokens.Should().Be(2);
    }

    [Fact]
    public async Task Gemini_CompleteWithWebSearch_CollectsGroundingChunkSources()
    {
        const string body = """
            {"candidates":[{"content":{"parts":[{"text":"Odpoved"}]},
              "groundingMetadata":{"groundingChunks":[
                {"web":{"uri":"https://a.example","title":"A"}},
                {"web":{"uri":"https://a.example","title":"A"}},
                {"web":{"uri":"https://b.example","title":"B"}}]}}],
             "usageMetadata":{"promptTokenCount":9,"candidatesTokenCount":2}}
            """;
        var client = new GeminiChatClient(Canned(body), "key");
        var result = await client.CompleteWithWebSearchAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        result.Text.Should().Be("Odpoved");
        result.InputTokens.Should().Be(9);
        result.OutputTokens.Should().Be(2);
        result.Sources.Should().HaveCount(2, "duplicate grounding chunk urls should be deduped");
        result.Sources.Should().Contain(s => s.Url == "https://b.example" && s.Title == "B");
    }

    [Fact]
    public async Task OpenAi_CompleteWithWebSearch_ParsesResponsesApiOutputAndCitations()
    {
        const string body = """
            {"output":[
              {"type":"web_search_call","id":"ws_1","status":"completed","action":{"type":"search","query":"q"}},
              {"type":"message","content":[
                {"type":"output_text","text":"Answer","annotations":[
                  {"type":"url_citation","url":"https://a.example","title":"A"}]}]}
            ],"usage":{"input_tokens":30,"output_tokens":8}}
            """;
        var client = new OpenAiChatClient(Canned(body), "sk-test");
        var result = await client.CompleteWithWebSearchAsync(new AiChatRequest("s", "u", "gpt-4o", 100), CancellationToken.None);

        result.Text.Should().Be("Answer");
        result.InputTokens.Should().Be(30);
        result.OutputTokens.Should().Be(8);
        result.Sources.Should().ContainSingle(s => s.Url == "https://a.example" && s.Title == "A");
    }

    [Fact]
    public async Task RateLimited_MapsToQuotaExceeded()
    {
        var client = new OpenAiChatClient(Canned("{}", HttpStatusCode.TooManyRequests), "sk");
        var act = () => client.CompleteAsync(new AiChatRequest("s", "u", "m", 100), CancellationToken.None);

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.ErrorType.Should().Be("QuotaExceeded");
    }
}
