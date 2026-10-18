using System.Text.Json;
using PublicPharmacy.Api.Models;

namespace PublicPharmacy.Api.Services;

public sealed class JsonFileStore
{
    private readonly string _dataDirectory;
    private readonly JsonSerializerOptions _options = new() { WriteIndented = true };
    private readonly SemaphoreSlim _gate = new(1, 1);

    public JsonFileStore(IWebHostEnvironment environment)
    {
        _dataDirectory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(_dataDirectory);
        EnsureFile("medicines.json", SeedMedicines());
        EnsureFile("sales.json", new List<Sale>());
    }

    private string PathFor(string name) => Path.Combine(_dataDirectory, name);

    private void EnsureFile<T>(string name, T seed)
    {
        var path = PathFor(name);
        if (!File.Exists(path))
            File.WriteAllText(path, JsonSerializer.Serialize(seed, _options));
    }

    private static List<Medicine> SeedMedicines() =>
    [
        new() { FullName = "Paracetamol 500mg", Notes = "Pain and fever relief", ExpiryDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(10)), Quantity = 50, Price = 25.50m, Brand = "Public Pharma" },
        new() { FullName = "Cetirizine 10mg", Notes = "Allergy relief", ExpiryDate = DateOnly.FromDateTime(DateTime.Today.AddDays(18)), Quantity = 24, Price = 18.00m, Brand = "HealthPlus" },
        new() { FullName = "Vitamin C Tablets", Notes = "Keep in a cool, dry place", ExpiryDate = DateOnly.FromDateTime(DateTime.Today.AddMonths(8)), Quantity = 6, Price = 99.99m, Brand = "WellLife" }
    ];

    public async Task<List<Medicine>> GetMedicinesAsync()
    {
        await _gate.WaitAsync();
        try { return await ReadAsync<List<Medicine>>("medicines.json") ?? new(); }
        finally { _gate.Release(); }
    }

    public async Task<List<Sale>> GetSalesAsync()
    {
        await _gate.WaitAsync();
        try { return await ReadAsync<List<Sale>>("sales.json") ?? new(); }
        finally { _gate.Release(); }
    }

    public async Task AddMedicineAsync(Medicine medicine)
    {
        await _gate.WaitAsync();
        try
        {
            var medicines = await ReadAsync<List<Medicine>>("medicines.json") ?? new();
            medicines.Add(medicine);
            await WriteAsync("medicines.json", medicines);
        }
        finally { _gate.Release(); }
    }

    public async Task<(bool Success, string? Error, Sale? Sale)> RecordSaleAsync(Guid medicineId, int quantity)
    {
        await _gate.WaitAsync();
        try
        {
            var medicines = await ReadAsync<List<Medicine>>("medicines.json") ?? new();
            var medicine = medicines.FirstOrDefault(m => m.Id == medicineId);
            if (medicine is null) return (false, "Medicine was not found.", null);
            if (quantity <= 0) return (false, "Quantity sold must be greater than zero.", null);
            if (medicine.Quantity < quantity) return (false, $"Only {medicine.Quantity} unit(s) are in stock.", null);

            medicine.Quantity -= quantity;
            var sales = await ReadAsync<List<Sale>>("sales.json") ?? new();
            var sale = new Sale
            {
                MedicineId = medicine.Id,
                MedicineName = medicine.FullName,
                QuantitySold = quantity,
                UnitPrice = medicine.Price,
                TotalAmount = decimal.Round(medicine.Price * quantity, 2)
            };
            sales.Add(sale);

            await WriteAsync("medicines.json", medicines);
            await WriteAsync("sales.json", sales);
            return (true, null, sale);
        }
        finally { _gate.Release(); }
    }

    private async Task<T?> ReadAsync<T>(string name)
    {
        await using var stream = File.OpenRead(PathFor(name));
        return await JsonSerializer.DeserializeAsync<T>(stream, _options);
    }

    private async Task WriteAsync<T>(string name, T data)
    {
        await using var stream = File.Create(PathFor(name));
        await JsonSerializer.SerializeAsync(stream, data, _options);
    }
}
