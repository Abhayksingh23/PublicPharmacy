namespace PublicPharmacy.Api.Models;

public sealed class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MedicineId { get; set; }
    public string MedicineName { get; set; } = "";
    public int QuantitySold { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime SoldAtUtc { get; set; } = DateTime.UtcNow;
}
