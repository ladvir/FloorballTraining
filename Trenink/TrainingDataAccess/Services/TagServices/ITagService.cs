﻿using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TagServices;

public interface ITagService
{
    Task<Tag> CreateTag(TagDto tag);
    Task<List<TagDto>> GetAllTags();

    Task<List<TagDto>> GetTagsByParentName(string parentTagName);


    Task<List<TagDto>> GetAllTagDtosByIds(IEnumerable<int> tagIds);

    Task<List<Tag>> GetAllTagsByIds(IEnumerable<int> tagIds);

    Task<TagDto> GetTag(int id);
    Task UpdateTag(TagDto tag);
    Task DeleteTag(Tag tag);
}