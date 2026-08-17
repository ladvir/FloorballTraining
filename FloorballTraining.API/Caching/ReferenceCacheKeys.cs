namespace FloorballTraining.API.Caching;

/// <summary>Cache keys for read-heavy reference lists (B7/#14).</summary>
public static class ReferenceCacheKeys
{
    public const string TagsAll = "reference:tags:all";
    public const string EquipmentsAll = "reference:equipments:all";
    public const string AgeGroupsAll = "reference:agegroups:all";
    public const string PlacesAll = "reference:places:all";
}
