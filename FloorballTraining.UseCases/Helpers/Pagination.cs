namespace FloorballTraining.UseCases.Helpers;

public class Pagination<T>(int pageIndex, int pageSize, int totalItems, IReadOnlyList<T>? data)
    where T : class
{
    public int PageIndex { get; set; } = pageIndex;

    public int PageSize { get; set; } = pageSize;

    public int Count { get; set; } = totalItems;

    public IReadOnlyList<T>? Data { get; set; } = data;
}