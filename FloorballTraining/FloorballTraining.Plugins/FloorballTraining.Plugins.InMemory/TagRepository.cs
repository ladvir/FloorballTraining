using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.Plugins.InMemory
{
    public class TagRepository : ITagRepository
    {

        public readonly List<Tag> Tags = new()
        {
            new Tag { TagId = 1, Name = "Florbalový dril", ParentTagId = null, Color = "#ffd254" },
            new Tag { TagId = 11, Name = "1 x 1", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 12, Name = "2 x 2", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 13, Name = "3 x 3", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 14, Name = "4 x 4", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 15, Name = "5 x 5", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 16, Name = "2 x 3", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 17, Name = "2 x 1", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 29, Name = "Střelba", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 30, Name = "Přihrávka", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 31, Name = "Vedení míčku", ParentTagId = 1, Color = "#ffd254" },
            new Tag { TagId = 35, Name = "Uvolňování", ParentTagId = 1, Color = "#ffd254" },

            new Tag { TagId = 5, Name = "Forma", ParentTagId = null, Color = "#d9980d" },
            new Tag { TagId = 25, Name = "Hra", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 26, Name = "Florbal", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 27, Name = "Test", ParentTagId = 5, Color = "#d9980d" },
            new Tag { TagId = 28, Name = "Štafeta", ParentTagId = 5, Color = "#d9980d" },

            new Tag { TagId = 3, Name = "Hráč", ParentTagId = null, Color = "#27dbf5" },
            new Tag { TagId = 18, Name = "Brankář", ParentTagId = 3, Color = "#27dbf5" },
            new Tag { TagId = 19, Name = "Útočník", ParentTagId = 3, Color = "#27dbf5" },
            new Tag { TagId = 20, Name = "Obránce", ParentTagId = 3, Color = "#27dbf5" },

            new Tag { TagId = 6, Name = "Tělesná průprava", ParentTagId = null, Color = "#17a258" },
            new Tag { TagId = 32, Name = "Ohebnost", ParentTagId = 6, Color = "#17a258" },
            new Tag { TagId = 33, Name = "Síla", ParentTagId = 6, Color = "#17a258" },
            new Tag { TagId = 34, Name = "Výbušnost", ParentTagId = 6, Color = "#17a258" },
            new Tag { TagId = 36, Name = "Rychlost", ParentTagId = 6, Color = "#17a258" },

            new Tag { TagId = 4, Name = "Tréninková část", ParentTagId = null, Color = "#0989c2" },
            new Tag { TagId = 21, Name = "Rozehřátí", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 22, Name = "Rozcvička", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 23, Name = "Dril", ParentTagId = 4, Color = "#0989c2" },
            new Tag { TagId = 24, Name = "Protahování", ParentTagId = 4, Color = "#0989c2" },

            new Tag { TagId = 7, Name = "Ostatní", ParentTagId = null, Color = "#e6e9eb" },
            new Tag { TagId = 37, Name = "Herní myšlení", ParentTagId = 7, Color = "#e6e9eb" },
            new Tag { TagId = 38, Name = "Spolupráce v týmu", ParentTagId = 7, Color = "#e6e9eb" },

            new Tag { TagId = 10, Name = "Vlastní", ParentTagId = null, Color = "#666666" }

        };
        public async Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString)
        {
            SetParentTag();

            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Tag>>(Tags);



            return BuildTree(Tags.Where(a => a.Name.Contains(searchString, StringComparison.OrdinalIgnoreCase)).ToList());
        }

        private List<Tag> BuildTree(List<Tag> tags)
        {
            if (!tags.Any()) return new List<Tag>();
            var result = new List<Tag>();

            //var maxLevel = tags.Max(t => t.Level);

            foreach (var tag in tags)
            {
                if (tag.ParentTag != null)
                {
                    var parentTagId = tag.ParentTagId;

                    var parent = Tags.First(t => t.TagId == parentTagId);

                    if (!result.Contains(parent)) { result.Add(parent); }
                    result = BuildTree(result);

                    if (!result.Contains(tag)) { result.Add(tag); }
                }
                else
                {
                    if (result.All(t => t.TagId != tag.TagId)) result.Add(tag);
                }
            }

            return result;
        }

        public async Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId)
        {
            SetParentTag();

            return await Task.FromResult(
                parentTagId.HasValue
                    ? Tags.Where(x => x.ParentTag != null && x.ParentTag.TagId == parentTagId)
                    : Tags.Where(x => x.ParentTag == null)
                );
        }

        public Task UpdateTagAsync(Tag tag)
        {
            var existingTag = Tags.FirstOrDefault(a => a.TagId == tag.TagId) ?? new Tag();
            if (existingTag == null)
            {
                throw new Exception("Štítek nenalezen");
            }

            existingTag.Merge(tag);

            return Task.CompletedTask;
        }

        public async Task<Tag> GetTagByIdAsync(int tagId)
        {
            var existingTag = Tags.FirstOrDefault(a => a.TagId == tagId) ?? new Tag();

            return await Task.FromResult(existingTag.Clone());
        }

        public Task AddTagAsync(Tag tag)
        {
            if (Tags.Any(x => x.Name.Equals(tag.Name, StringComparison.OrdinalIgnoreCase)))
                return Task.CompletedTask;

            var maxId = Tags.Max(x => x.TagId);
            tag.TagId = maxId + 1;
            tag.ParentTagId = tag.ParentTag?.TagId;

            Tags.Add(tag);

            return Task.CompletedTask;
        }

        public void SetParentTag()
        {
            foreach (var tag in Tags)
            {
                tag.ParentTag = Tags.FirstOrDefault(t => t.TagId == tag.ParentTagId);
            }
        }

    }
}