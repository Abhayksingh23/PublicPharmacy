using PublicPharmacy.Api.Models;
using PublicPharmacy.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace PublicPharmacy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MedicinesController(JsonFileStore store) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Medicine>>> GetAll([FromQuery] string? search)
    {
        var medicines = await store.GetMedicinesAsync();
        if (!string.IsNullOrWhiteSpace(search))
            medicines = medicines.Where(m => m.FullName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(medicines.OrderBy(m => m.FullName));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Medicine>> GetById(Guid id)
    {
        var medicine = (await store.GetMedicinesAsync()).FirstOrDefault(m => m.Id == id);
        return medicine is null ? NotFound(new { message = "Medicine not found." }) : Ok(medicine);
    }

    [HttpPost]
    public async Task<ActionResult<Medicine>> Create(CreateMedicineRequest request)
    {
        if (request.ExpiryDate == default)
            return BadRequest(new { message = "A valid expiry date is required." });
        if (request.Price <= 0)
            return BadRequest(new { message = "Price must be greater than zero." });

        var medicine = new Medicine
        {
            FullName = request.FullName.Trim(),
            Notes = request.Notes?.Trim() ?? "",
            ExpiryDate = request.ExpiryDate,
            Quantity = request.Quantity,
            Price = decimal.Round(request.Price, 2),
            Brand = request.Brand.Trim()
        };
        await store.AddMedicineAsync(medicine);
        return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
    }
}
