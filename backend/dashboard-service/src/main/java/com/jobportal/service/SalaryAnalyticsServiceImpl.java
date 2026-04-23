package com.jobportal.service;

import com.jobportal.dto.JobStatus;
import com.jobportal.entity.Job;
import com.jobportal.repository.JobRepository;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class SalaryAnalyticsServiceImpl implements SalaryAnalyticsService {

    private static final List<String> RANGE_OPTIONS = List.of("3M", "6M", "1Y", "3Y");
    private static final List<String> LOCATION_OPTIONS = List.of("All Regions", "West Africa", "East Africa", "Europe", "North America");
    private static final List<String> EXPERIENCE_OPTIONS = List.of("All Levels", "Entry", "Mid", "Senior");

    private final JobRepository jobRepository;

    public SalaryAnalyticsServiceImpl(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Override
    public Map<String, Object> getCandidateSalaryTrends(String range, String industry, String location, String experience) {
        String normalizedRange = normalizeRange(range);
        String normalizedLocation = normalizeLocation(location);
        String normalizedExperience = normalizeExperience(experience);
        String normalizedIndustry = normalizeIndustry(industry);

        List<Job> activeJobs = jobRepository.findAll().stream()
                .filter(job -> job.getJobStatus() != JobStatus.CLOSED)
                .toList();

        List<Job> baseFiltered = activeJobs.stream()
                .filter(job -> "All Regions".equals(normalizedLocation) || normalizedLocation.equals(normalizeRegionFromLocation(job.getLocation())))
                .filter(job -> "All Levels".equals(normalizedExperience) || normalizedExperience.equals(normalizeExperienceFromJob(job.getExperience())))
                .toList();

        Set<String> industryOptionsSet = new LinkedHashSet<>();
        baseFiltered.stream()
                .map(Job::getIndustry)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .sorted(String::compareToIgnoreCase)
                .forEach(industryOptionsSet::add);

        if (industryOptionsSet.isEmpty()) {
            industryOptionsSet.addAll(List.of("Technology", "Finance", "Healthcare", "Manufacturing"));
        }

        String selectedIndustry = normalizedIndustry;
        if (!selectedIndustry.isBlank() && !containsIgnoreCase(industryOptionsSet, selectedIndustry)) {
            selectedIndustry = industryOptionsSet.iterator().next();
        }
        final String effectiveIndustry = selectedIndustry;

        List<Job> filtered = baseFiltered.stream()
                .filter(job -> effectiveIndustry.isBlank() || effectiveIndustry.equalsIgnoreCase(safeText(job.getIndustry())))
                .toList();

        List<YearMonth> periods = buildPeriods(normalizedRange);
        double baselineSalaryUsd = averageUsdSalary(filtered);

        List<Map<String, Object>> monthlySeries = new ArrayList<>();
        for (YearMonth period : periods) {
            List<Job> jobsInPeriod = filtered.stream()
                    .filter(job -> {
                        YearMonth jobMonth = toYearMonth(job);
                        return jobMonth != null && period.equals(jobMonth);
                    })
                    .toList();

            double avgUsd = averageUsdSalary(jobsInPeriod);
            if (avgUsd <= 0) {
                avgUsd = baselineSalaryUsd;
            }

            monthlySeries.add(Map.of(
                    "period", formatPeriodLabel(period, normalizedRange),
                    "salaryUsd", round2(avgUsd),
                    "salaryLowerUsd", round2(avgUsd * 0.9),
                    "salaryUpperUsd", round2(avgUsd * 1.1),
                    "jobs", jobsInPeriod.size()
            ));
        }

        List<Map<String, Object>> series = "3Y".equals(normalizedRange)
                ? groupMonthlySeriesByQuarter(monthlySeries)
                : monthlySeries;

        List<Double> seriesSalaries = series.stream()
                .map(item -> toDouble(item.get("salaryUsd")))
                .toList();

        double first = seriesSalaries.isEmpty() ? 0 : seriesSalaries.get(0);
        double last = seriesSalaries.isEmpty() ? 0 : seriesSalaries.get(seriesSalaries.size() - 1);
        double yoyGrowth = first > 0 ? ((last - first) / first) * 100 : 0;
        double median;
        if (seriesSalaries.isEmpty()) {
            median = 0;
        } else {
            List<Double> sorted = seriesSalaries.stream().sorted().toList();
            int mid = sorted.size() / 2;
            median = sorted.size() % 2 == 0
                    ? (sorted.get(mid - 1) + sorted.get(mid)) / 2.0
                    : sorted.get(mid);
        }
        int openRoles = series.stream().mapToInt(item -> ((Number) item.get("jobs")).intValue()).sum();
        String confidence = openRoles > 80 ? "High" : openRoles > 30 ? "Medium" : "Low";

        Map<String, Object> metrics = Map.of(
                "medianSalaryUsd", round2(median),
                "yoyGrowthPercent", round2(yoyGrowth),
                "openRoles", openRoles,
                "confidence", confidence,
                "profileEstimateUsd", round2(median * 0.94),
                "sampleSize", filtered.size()
        );

        List<Map<String, Object>> topIndustries = buildTopIndustries(baseFiltered);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("generatedAt", OffsetDateTime.now(ZoneOffset.UTC).toString());
        response.put("range", normalizedRange);
        response.put("industry", effectiveIndustry);
        response.put("location", normalizedLocation);
        response.put("experience", normalizedExperience);
        response.put("industryOptions", industryOptionsSet.stream().toList());
        response.put("rangeOptions", RANGE_OPTIONS);
        response.put("locationOptions", LOCATION_OPTIONS);
        response.put("experienceOptions", EXPERIENCE_OPTIONS);
        response.put("baseCurrency", "USD");
        Map<String, Double> currencyRates = buildCurrencyRates();
        response.put("currencyRates", currencyRates);
        response.put("currencyOptions", currencyRates.keySet().stream().toList());
        response.put("fxUpdatedAt", OffsetDateTime.now(ZoneOffset.UTC).toString());
        response.put("series", series);
        response.put("metrics", metrics);
        response.put("topIndustries", topIndustries);
        return response;
    }

    private Map<String, Double> buildCurrencyRates() {
        Map<String, Double> rates = new LinkedHashMap<>();
        rates.put("USD", 1.0);
        rates.put("NGN", 1600.0);
        rates.put("EUR", 0.93);
        rates.put("GBP", 0.79);
        rates.put("KES", 129.0);
        rates.put("GHS", 15.2);
        rates.put("ZAR", 18.7);
        rates.put("AED", 3.67);
        rates.put("CAD", 1.36);
        rates.put("INR", 83.2);
        return rates;
    }

    private List<Map<String, Object>> buildTopIndustries(List<Job> baseFiltered) {
        YearMonth now = YearMonth.now(ZoneOffset.UTC);
        List<YearMonth> window = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            window.add(now.minusMonths(i));
        }

        Map<String, List<Job>> byIndustry = new LinkedHashMap<>();
        for (Job job : baseFiltered) {
            String industry = safeText(job.getIndustry());
            if (industry.isBlank()) {
                industry = "Unknown";
            }
            byIndustry.computeIfAbsent(industry, key -> new ArrayList<>()).add(job);
        }

        return byIndustry.entrySet().stream()
                .map(entry -> {
                    List<Double> sparkline = new ArrayList<>();
                    for (YearMonth period : window) {
                        List<Job> jobs = entry.getValue().stream()
                                .filter(job -> {
                                    YearMonth jobMonth = toYearMonth(job);
                                    return jobMonth != null && period.equals(jobMonth);
                                })
                                .toList();
                        sparkline.add(round2(averageUsdSalary(jobs)));
                    }

                    double latest = lastNonZero(sparkline);
                    double medianSalary = medianUsdSalary(entry.getValue());
                    int openRoles = entry.getValue().size();
                    double growthPercent = computeGrowthPercent(sparkline);
                    String confidence = getIndustryConfidence(openRoles);

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("industry", entry.getKey());
                    item.put("sparklineUsd", sparkline);
                    item.put("latestSalaryUsd", latest);
                    item.put("medianSalaryUsd", round2(medianSalary));
                    item.put("growthPercent", round2(growthPercent));
                    item.put("openRoles", openRoles);
                    item.put("confidence", confidence);
                    return item;
                })
                .sorted(Comparator.comparingDouble((Map<String, Object> item) -> toDouble(item.get("medianSalaryUsd"))).reversed())
                .limit(4)
                .toList();
    }

    private double medianUsdSalary(List<Job> jobs) {
        List<Double> salaries = jobs.stream()
                .map(this::salaryToUsd)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        if (salaries.isEmpty()) {
            return 0;
        }
        int mid = salaries.size() / 2;
        return salaries.size() % 2 == 0
                ? (salaries.get(mid - 1) + salaries.get(mid)) / 2.0
                : salaries.get(mid);
    }

    private double computeGrowthPercent(List<Double> values) {
        double first = firstNonZero(values);
        double last = lastNonZero(values);
        if (first <= 0 || last <= 0) {
            return 0;
        }
        return ((last - first) / first) * 100;
    }

    private String getIndustryConfidence(int openRoles) {
        if (openRoles > 40) {
            return "High";
        }
        if (openRoles > 15) {
            return "Medium";
        }
        return "Low";
    }

    private List<Map<String, Object>> groupMonthlySeriesByQuarter(List<Map<String, Object>> monthlySeries) {
        Map<String, List<Map<String, Object>>> byQuarter = new LinkedHashMap<>();
        for (Map<String, Object> point : monthlySeries) {
            String period = String.valueOf(point.get("period"));
            String[] parts = period.split("-");
            if (parts.length != 2) {
                continue;
            }
            String key = period;
            byQuarter.computeIfAbsent(key, ignored -> new ArrayList<>()).add(point);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : byQuarter.entrySet()) {
            List<Map<String, Object>> points = entry.getValue();
            double salary = points.stream().mapToDouble(item -> toDouble(item.get("salaryUsd"))).average().orElse(0);
            int jobs = points.stream().mapToInt(item -> ((Number) item.get("jobs")).intValue()).sum();
            result.add(Map.of(
                    "period", entry.getKey(),
                    "salaryUsd", round2(salary),
                    "salaryLowerUsd", round2(salary * 0.9),
                    "salaryUpperUsd", round2(salary * 1.1),
                    "jobs", jobs
            ));
        }
        return result;
    }

    private List<YearMonth> buildPeriods(String range) {
        int months = switch (range) {
            case "3M" -> 3;
            case "6M" -> 6;
            case "1Y" -> 12;
            default -> 36;
        };

        YearMonth now = YearMonth.now(ZoneOffset.UTC);
        List<YearMonth> periods = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            periods.add(now.minusMonths(i));
        }
        return periods;
    }

    private String formatPeriodLabel(YearMonth period, String range) {
        if ("3Y".equals(range)) {
            int quarter = (period.getMonthValue() - 1) / 3 + 1;
            return String.format(Locale.ROOT, "%02d-Q%d", period.getYear() % 100, quarter);
        }
        String monthAbbr = period.getMonth().name().substring(0, 1)
                + period.getMonth().name().substring(1, 3).toLowerCase(Locale.ROOT);
        return monthAbbr + " '" + String.format(Locale.ROOT, "%02d", period.getYear() % 100);
    }

    private YearMonth toYearMonth(Job job) {
        if (job.getPostTime() == null) {
            return null;
        }
        return YearMonth.from(job.getPostTime());
    }

    private double averageUsdSalary(List<Job> jobs) {
        List<Double> salaries = jobs.stream()
                .map(this::salaryToUsd)
                .filter(Objects::nonNull)
                .toList();
        if (salaries.isEmpty()) {
            return 0;
        }
        return salaries.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private Double salaryToUsd(Job job) {
        List<Long> salaryPoints = new ArrayList<>();
        if (job.getPackageOffered() != null && job.getPackageOffered() > 0) {
            salaryPoints.add(job.getPackageOffered());
        }
        if (job.getMaxPackageOffered() != null && job.getMaxPackageOffered() > 0) {
            salaryPoints.add(job.getMaxPackageOffered());
        }
        if (salaryPoints.isEmpty()) {
            return null;
        }

        double midpoint;
        if (salaryPoints.size() == 2) {
            midpoint = (salaryPoints.get(0) + salaryPoints.get(1)) / 2.0;
        } else {
            midpoint = salaryPoints.get(0);
        }

        String currency = safeText(job.getCurrency()).toUpperCase(Locale.ROOT);
        if ("NGN".equals(currency)) {
            return midpoint / 1600.0;
        }
        return midpoint;
    }

    private String normalizeRange(String value) {
        if (value == null) {
            return "1Y";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "3M", "6M", "1Y", "3Y" -> normalized;
            default -> "1Y";
        };
    }

    private String normalizeIndustry(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private String normalizeLocation(String value) {
        if (value == null || value.isBlank()) {
            return "All Regions";
        }
        String normalized = value.trim();
        if (LOCATION_OPTIONS.contains(normalized)) {
            return normalized;
        }
        return "All Regions";
    }

    private String normalizeExperience(String value) {
        if (value == null || value.isBlank()) {
            return "All Levels";
        }
        String normalized = value.trim();
        if (EXPERIENCE_OPTIONS.contains(normalized)) {
            return normalized;
        }
        return "All Levels";
    }

    private String normalizeRegionFromLocation(String location) {
        String value = safeText(location).toLowerCase(Locale.ROOT);
        if (value.contains("lagos") || value.contains("nigeria") || value.contains("ghana") || value.contains("africa")) {
            return "West Africa";
        }
        if (value.contains("kenya") || value.contains("uganda") || value.contains("tanzania")) {
            return "East Africa";
        }
        if (value.contains("london") || value.contains("berlin") || value.contains("paris") || value.contains("europe")) {
            return "Europe";
        }
        if (value.contains("new york") || value.contains("usa") || value.contains("canada") || value.contains("toronto")) {
            return "North America";
        }
        return "All Regions";
    }

    private String normalizeExperienceFromJob(String experience) {
        String value = safeText(experience).toLowerCase(Locale.ROOT);
        if (value.contains("entry") || value.contains("0-2") || value.contains("0-1")
                || value.contains("fresher") || value.contains("junior") || value.contains("graduate")) {
            return "Entry";
        }
        if (value.contains("senior") || value.contains("expert") || value.contains("lead")
                || value.contains("principal") || value.contains("10") || value.contains("15")) {
            return "Senior";
        }
        return "Mid";
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean containsIgnoreCase(Set<String> values, String candidate) {
        for (String value : values) {
            if (value.equalsIgnoreCase(candidate)) {
                return true;
            }
        }
        return false;
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double lastNonZero(List<Double> values) {
        for (int i = values.size() - 1; i >= 0; i--) {
            double value = values.get(i);
            if (value > 0) {
                return value;
            }
        }
        return 0;
    }

    private double firstNonZero(List<Double> values) {
        for (double value : values) {
            if (value > 0) {
                return value;
            }
        }
        return 0;
    }
}
