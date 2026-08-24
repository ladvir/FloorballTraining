using System.Globalization;
using System.Text;
using System.Text.Json;
using FloorballTraining.API.Services;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Enums;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Videos.Interfaces;
using Hangfire;
using Microsoft.AspNetCore.Hosting;
using Xabe.FFmpeg;

namespace FloorballTraining.API.Jobs;

/// <summary>
/// Burns a video-editor analysis's lines/freehand strokes into a standalone video file (#141) —
/// non-destructive: the source video and its editable VideoAnnotation are never touched, the
/// result is saved as a new sibling Video under the same owner (Training/Activity/Appointment),
/// so the coach can keep reopening the original in the editor exactly as before.
/// </summary>
public sealed class VideoAnnotationExportJob(
    IVideoAnnotationRepository annotationRepository,
    IVideoRepository videoRepository,
    IAddVideoUseCase addVideoUseCase,
    IVideoFileStorage fileStorage,
    IWebHostEnvironment env,
    ILogger<VideoAnnotationExportJob> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [DisableConcurrentExecution(timeoutInSeconds: 60)]
    public async Task RunAsync(int annotationId, CancellationToken ct = default)
    {
        var workDir = Directory.CreateTempSubdirectory("video-export-");
        try
        {
            var annotation = await annotationRepository.GetByIdAsync(annotationId);
            var video = annotation == null ? null : await videoRepository.GetByIdAsync(annotation.VideoId);
            if (annotation == null || video == null || video.FilePath == null)
            {
                logger.LogWarning("Video export: annotation {AnnotationId} or its video is gone, skipping", annotationId);
                return;
            }

            var sourcePath = Path.Combine(env.WebRootPath, video.FilePath.Replace('/', Path.DirectorySeparatorChar));
            var mediaInfo = await FFmpeg.GetMediaInfo(sourcePath, ct);
            var stream = mediaInfo.VideoStreams.First();
            var durationMs = (int)mediaInfo.Duration.TotalMilliseconds;

            var trimStartMs = Math.Clamp(annotation.TrimStartMs ?? 0, 0, durationMs);
            var trimEndMs = Math.Clamp(annotation.TrimEndMs ?? durationMs, trimStartMs, durationMs);

            var state = ParseState(annotation.DataJson);
            var overlays = BuildOverlayPngs(workDir.FullName, state, stream.Width, stream.Height, trimStartMs, trimEndMs);

            var outputPath = Path.Combine(workDir.FullName, "output.mp4");
            await RunFFmpegAsync(sourcePath, overlays, trimStartMs, trimEndMs, outputPath, ct);

            var ownerType = GetOwnerType(video);
            var ownerId = GetOwnerId(video, ownerType);
            var relativePath = await fileStorage.AdoptGeneratedFileAsync(outputPath, ".mp4", ownerType, ownerId);

            var title = $"{(string.IsNullOrWhiteSpace(video.Title) ? "Video" : video.Title)} (s anotacemi)";
            var newVideo = await addVideoUseCase.ExecuteFileAsync(ownerType, ownerId, relativePath, title, video.CreatedByUserId);

            await annotationRepository.SetExportStatusAsync(annotationId, VideoExportStatus.Completed, newVideo.Id, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Video export failed for annotation {AnnotationId}", annotationId);
            var message = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
            await annotationRepository.SetExportStatusAsync(annotationId, VideoExportStatus.Failed, null, message);
        }
        finally
        {
            try { workDir.Delete(recursive: true); } catch { /* best-effort cleanup */ }
        }
    }

    private static VideoOwnerType GetOwnerType(Video video) =>
        video.ActivityId.HasValue ? VideoOwnerType.Activity
        : video.TrainingId.HasValue ? VideoOwnerType.Training
        : VideoOwnerType.Appointment;

    private static int GetOwnerId(Video video, VideoOwnerType ownerType) => ownerType switch
    {
        VideoOwnerType.Activity => video.ActivityId!.Value,
        VideoOwnerType.Training => video.TrainingId!.Value,
        _ => video.AppointmentId!.Value,
    };

    private record PointJson(double X, double Y);
    private record LineJson(double X1, double Y1, double X2, double Y2, string Color, double StrokeWidth, string? Dash, int StartMs, int EndMs);
    private record FreehandJson(List<PointJson>? Points, string Color, double StrokeWidth, string? Dash, int StartMs, int EndMs);
    private record AnnotationStateJson(List<LineJson>? Lines, List<FreehandJson>? FreehandLines);

    private static AnnotationStateJson ParseState(string dataJson)
    {
        try
        {
            return JsonSerializer.Deserialize<AnnotationStateJson>(dataJson, JsonOptions)
                   ?? new AnnotationStateJson(null, null);
        }
        catch (JsonException)
        {
            return new AnnotationStateJson(null, null);
        }
    }

    private record OverlayPng(string FilePath, double StartSec, double EndSec);

    // One transparent PNG per annotation object (not merged into shared intervals) - simpler to
    // build, and ffmpeg's chained overlay filter composites any number of them correctly.
    private static List<OverlayPng> BuildOverlayPngs(
        string workDir, AnnotationStateJson state, int width, int height, int trimStartMs, int trimEndMs)
    {
        var overlays = new List<OverlayPng>();
        var index = 0;

        foreach (var line in state.Lines ?? [])
        {
            var window = ClampToTrim(line.StartMs, line.EndMs, trimStartMs, trimEndMs);
            if (window == null) continue;
            var png = VideoAnnotationRenderer.RenderLine(width, height, line.X1, line.Y1, line.X2, line.Y2, line.Color, line.StrokeWidth, line.Dash);
            overlays.Add(SavePng(workDir, ref index, png, window.Value));
        }

        foreach (var freehand in state.FreehandLines ?? [])
        {
            var window = ClampToTrim(freehand.StartMs, freehand.EndMs, trimStartMs, trimEndMs);
            if (window == null || (freehand.Points?.Count ?? 0) < 2) continue;
            var points = freehand.Points!.Select(p => (p.X, p.Y)).ToList();
            var png = VideoAnnotationRenderer.RenderFreehand(width, height, points, freehand.Color, freehand.StrokeWidth, freehand.Dash);
            overlays.Add(SavePng(workDir, ref index, png, window.Value));
        }

        return overlays;
    }

    /// <summary>Null if the annotation's window doesn't intersect the trim window at all.</summary>
    private static (double StartSec, double EndSec)? ClampToTrim(int startMs, int endMs, int trimStartMs, int trimEndMs)
    {
        var clampedStart = Math.Max(startMs, trimStartMs);
        var clampedEnd = Math.Min(endMs, trimEndMs);
        if (clampedEnd <= clampedStart) return null;
        return ((clampedStart - trimStartMs) / 1000.0, (clampedEnd - trimStartMs) / 1000.0);
    }

    private static OverlayPng SavePng(string workDir, ref int index, byte[] png, (double StartSec, double EndSec) window)
    {
        var path = Path.Combine(workDir, $"overlay-{index++}.png");
        File.WriteAllBytes(path, png);
        return new OverlayPng(path, window.StartSec, window.EndSec);
    }

    private static async Task RunFFmpegAsync(
        string sourcePath, List<OverlayPng> overlays, int trimStartMs, int trimEndMs, string outputPath, CancellationToken ct)
    {
        var inv = CultureInfo.InvariantCulture;
        var trimStartSec = (trimStartMs / 1000.0).ToString(inv);
        var durationSec = ((trimEndMs - trimStartMs) / 1000.0).ToString(inv);

        var args = new StringBuilder()
            .Append(CultureInfo.InvariantCulture, $"-ss {trimStartSec} -t {durationSec} -i \"{sourcePath}\"");
        foreach (var overlay in overlays)
            args.Append(CultureInfo.InvariantCulture, $" -i \"{overlay.FilePath}\"");

        if (overlays.Count > 0)
        {
            var filter = new StringBuilder();
            var lastLabel = "0:v";
            for (var i = 0; i < overlays.Count; i++)
            {
                var outLabel = i == overlays.Count - 1 ? "vout" : $"v{i}";
                filter.Append(CultureInfo.InvariantCulture,
                    $"[{lastLabel}][{i + 1}:v]overlay=enable='between(t,{overlays[i].StartSec.ToString(inv)},{overlays[i].EndSec.ToString(inv)})'[{outLabel}];");
                lastLabel = outLabel;
            }
            args.Append(CultureInfo.InvariantCulture, $" -filter_complex \"{filter.ToString().TrimEnd(';')}\" -map \"[vout]\"");
        }
        else
        {
            args.Append(" -map 0:v");
        }

        args.Append(" -map 0:a? -c:a copy -c:v libx264 -preset veryfast -crf 20 -movflags +faststart");

        var conversion = FFmpeg.Conversions.New()
            .AddParameter(args.ToString())
            .SetOutput(outputPath)
            .SetOverwriteOutput(true);
        await conversion.Start(ct);
    }
}
