using System.ComponentModel.DataAnnotations;

namespace PublicPharmacy.Api.Models;

public sealed class CreateSaleRequest
{
    [Required]
    public Guid MedicineId { get; set; }

    [Range(1, 1000000)]
    public int QuantitySold { get; set; }
}
