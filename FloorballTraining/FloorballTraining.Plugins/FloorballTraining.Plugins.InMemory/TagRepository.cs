using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.Plugins.InMemory
{
    public class TagRepository : ITagRepository
    {

        private readonly List<Tag> _tags = new()
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

            new Tag { TagId = 9, Name = "Hráčská kategorie", ParentTagId = null, Color = "#2196f3" },
            new Tag { TagId = 47, Name = "U7 - předpřípravka", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 48, Name = "U9 - přípravka", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 49, Name = "U11 - elévi", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 50, Name = "U13 - ml. žáci", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 51, Name = "U15 - st. žáci", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 52, Name = "U17 - dorost", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 53, Name = "U21 - junioři ", ParentTagId = 9, Color = "#2196f3" },
            new Tag { TagId = 54, Name = "Muži", ParentTagId = 9, Color = "#2196f3" },

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

            new Tag { TagId = 8, Name = "Vybavení", ParentTagId = null, Color = "#ff9102" },
            new Tag { TagId = 39, Name = "Florbalové míčky", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 40, Name = "Florbalová branka", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 41, Name = "Rozlišovací dresy", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 42, Name = "Kužely", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 43, Name = "Skočky", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 44, Name = "Žebřík", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 45, Name = "Švihadlo", ParentTagId = 8, Color = "#ff9102" },
            new Tag { TagId = 46, Name = "Fotbalový míč", ParentTagId = 8, Color = "#ff9102" },

            new Tag { TagId = 7, Name = "Ostatní", ParentTagId = null, Color = "#e6e9eb" },
            new Tag { TagId = 37, Name = "Herní myšlení", ParentTagId = 7, Color = "#e6e9eb" },
            new Tag { TagId = 38, Name = "Spolupráce v týmu", ParentTagId = 7, Color = "#e6e9eb" },

            new Tag { TagId = 10, Name = "Vlastní", ParentTagId = null, Color = "#666666" }

        };
        public async Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString)
        {
            SetParentTag();

            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Tag>>(_tags);



            return BuildTree(_tags.Where(a => a.Name.Contains(searchString, StringComparison.OrdinalIgnoreCase)).ToList());
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

                    var parent = _tags.First(t => t.TagId == parentTagId);

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
                    ? _tags.Where(x => x.ParentTag != null && x.ParentTag.TagId == parentTagId)
                    : _tags.Where(x => x.ParentTag == null)
                );
        }

        public Task UpdateTagAsync(Tag tag)
        {
            var existingTag = _tags.FirstOrDefault(a => a.TagId == tag.TagId) ?? new Tag();
            if (existingTag == null)
            {
                throw new Exception("Štítek nenalezen");
            }

            existingTag.Merge(tag);

            return Task.CompletedTask;
        }

        public async Task<Tag> GetTagByIdAsync(int tagId)
        {
            var existingTag = _tags.FirstOrDefault(a => a.TagId == tagId) ?? new Tag();

            return await Task.FromResult(existingTag.Clone());
        }

        public Task AddTagAsync(Tag tag)
        {
            if (_tags.Any(x => x.Name.Equals(tag.Name, StringComparison.OrdinalIgnoreCase)))
                return Task.CompletedTask;

            var maxId = _tags.Max(x => x.TagId);
            tag.TagId = maxId + 1;
            tag.ParentTagId = tag.ParentTag?.TagId;

            _tags.Add(tag);

            return Task.CompletedTask;
        }

        public void SetParentTag()
        {
            foreach (var tag in _tags)
            {
                tag.ParentTag = _tags.FirstOrDefault(t => t.TagId == tag.ParentTagId);
            }
        }

    }
}