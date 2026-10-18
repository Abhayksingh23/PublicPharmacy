using PublicPharmacy.Api.Models;
using PublicPharmacy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace PublicPharmacy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class SalesController(JsonFileStore store) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Sale>>> GetAll() =>
        Ok((await store.GetSalesAsync()).OrderByDescending(s => s.SoldAtUtc));

    [HttpPost]
    public async Task<IActionResult> Create(CreateSaleRequest request)
    {
        if (request.MedicineId == Guid.Empty)
            return BadRequest(new { message = "Please select a medicine." });

        var result = await store.RecordSaleAsync(request.MedicineId, request.QuantitySold);
        if (!result.Success)
            return BadRequest(new { message = result.Error });

        return Ok(result.Sale);
    }
}
