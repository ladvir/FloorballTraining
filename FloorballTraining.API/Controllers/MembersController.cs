using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.Members.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FloorballTraining.API.Controllers;

public class MembersController(
    IViewMembersAllUseCase viewMembersAllUseCase,
    IViewMemberByIdUseCase viewMemberByIdUseCase,
    IAddMemberUseCase addMemberUseCase,
    IEditMemberUseCase editMemberUseCase,
    IDeleteMemberUseCase deleteMemberUseCase)
    : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await viewMembersAllUseCase.ExecuteAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await viewMemberByIdUseCase.ExecuteAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] MemberDto dto)
    {
        await addMemberUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] MemberDto dto)
    {
        await editMemberUseCase.ExecuteAsync(dto);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] MemberDto dto)
    {
        await deleteMemberUseCase.ExecuteAsync(dto);
        return NoContent();
    }
}
