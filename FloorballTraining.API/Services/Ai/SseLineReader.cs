using System.Runtime.CompilerServices;

namespace FloorballTraining.API.Services.Ai;

public record SseEvent(string? Event, string Data);

/// <summary>
/// Minimal server-sent-events parser for provider response streams. Handles the
/// subset all three providers emit: optional "event:" line, one or more "data:"
/// lines (joined with newline), events separated by a blank line. Comment lines
/// (":") and unknown fields are ignored per the SSE spec.
/// </summary>
public static class SseLineReader
{
    public static async IAsyncEnumerable<SseEvent> ReadAsync(
        Stream stream,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        using var reader = new StreamReader(stream);
        string? eventName = null;
        var dataLines = new List<string>();

        while (await reader.ReadLineAsync(cancellationToken) is { } line)
        {
            if (line.Length == 0)
            {
                if (dataLines.Count > 0)
                    yield return new SseEvent(eventName, string.Join('\n', dataLines));
                eventName = null;
                dataLines.Clear();
                continue;
            }

            if (line.StartsWith(':'))
                continue;

            if (line.StartsWith("event:", StringComparison.Ordinal))
            {
                eventName = line["event:".Length..].TrimStart();
            }
            else if (line.StartsWith("data:", StringComparison.Ordinal))
            {
                dataLines.Add(line["data:".Length..].TrimStart());
            }
        }

        // Stream ended without a trailing blank line — flush the last event.
        if (dataLines.Count > 0)
            yield return new SseEvent(eventName, string.Join('\n', dataLines));
    }
}
