namespace FloorballTraining.CoreBusiness.Enums;

/// <summary>Status of burning a <see cref="VideoAnnotation"/>'s lines into a standalone video file (#141).</summary>
public enum VideoExportStatus
{
    None,
    Processing,
    Completed,
    Failed
}
