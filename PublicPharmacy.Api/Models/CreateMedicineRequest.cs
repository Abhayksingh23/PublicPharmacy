using System.ComponentModel.DataAnnotations;

namespace PublicPharmacy.Api.Models;

public sealed class CreateMedicineRequest
{
    [Required, StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = "";

    [StringLength(1000)]
    public string Notes { get; set; } = "";

    public DateOnly ExpiryDate { get; set; }

    [Range(0, 1000000)]
    public int Quantity { get; set; }

    [Range(typeof(decimal), "0.01", "9999999.99")]
    public decimal Price { get; set; }

    [Required, StringLength(100, MinimumLength = 1)]
    public string Brand { get; set; } = "";
}
