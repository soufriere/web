# Photo Scanner Tool - Product Brief

**Version:** 1.0
**Date:** February 17, 2026
**Status:** Design Phase

---

## Executive Summary

A Mac-native tool that analyzes photos in the macOS Photos library, scoring them by quality metrics and detecting similar/duplicate images. The tool automatically creates smart albums for easy photo curation and cleanup.

---

## Product Goals

### Primary Objectives
1. **Quality Assessment**: Score all photos based on technical and aesthetic quality
2. **Duplicate Detection**: Identify similar and duplicate photos across the library
3. **Automated Organization**: Create Albums in Photos for easy review and cleanup
4. **Single-Script Simplicity**: Deliver as a standalone executable or script

### Success Metrics
- Accurately score 10,000+ photos in reasonable time (<1 hour for typical library)
- Detect duplicates with >95% accuracy
- Zero data loss (read-only operations on originals)
- Seamless integration with Photos app

---

## User Experience

### Workflow
1. **Run the tool** - Execute single command/app
2. **Analysis phase** - Tool scans Photos library and processes images
3. **Progress feedback** - Real-time progress updates
4. **Album creation** - Automatically creates albums in Photos:
   - "★ Quality Score - Best to Worst" - All photos ranked by quality
   - "🔍 Duplicates - Group 1", "🔍 Duplicates - Group 2", etc. - Similar photo groups
5. **Review in Photos** - Open Photos app to review curated albums

### User Controls (Future Enhancements)
- Configurable quality thresholds
- Similarity sensitivity adjustment
- Select specific albums to scan
- Dry-run mode

---

## Technical Architecture

### Recommended Approach: Python + AppleScript Hybrid

**Why This Stack:**
- Python: Rich ecosystem for image processing (OpenCV, PIL, scikit-image)
- AppleScript: Native Photos app integration for album creation
- Single script: Package as standalone executable with PyInstaller

### Alternative Approaches Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Pure Swift + PhotoKit** | Native integration, fast, secure | Requires Xcode, compile step, less flexible for ML | Good for v2.0 |
| **Python + PhotoKit bridge** | Best of both worlds | Complex setup, PyObjC overhead | Over-engineered |
| **Direct SQLite access** | Fast reads | Fragile (DB schema changes), read-only | Too risky |
| **Python + AppleScript** | Simple, portable, powerful libraries | AppleScript slower for bulk ops | ✅ **Selected** |

---

## Feature Specifications

### 1. Quality Scoring System

**Metrics to Evaluate:**

#### Technical Quality (60% weight)
- **Sharpness/Blur Detection** (25%)
  - Laplacian variance method
  - Threshold: Variance < 100 = blurry

- **Resolution Quality** (15%)
  - Megapixels (higher = better)
  - Penalize very low resolution (<1MP)

- **Proper Exposure** (10%)
  - Histogram analysis (avoid clipping)
  - Detect over/underexposed images

- **Noise Level** (10%)
  - Estimate ISO noise in dark regions

#### Aesthetic Quality (40% weight)
- **Composition** (20%)
  - Rule of thirds analysis
  - Face detection (centered faces boost score)

- **Color Vibrancy** (10%)
  - Saturation and color distribution

- **Overall Aesthetic** (10%)
  - Optional: Pre-trained NIMA model for AI aesthetic scoring

**Scoring Output:**
- 0-100 scale
- Categories: Excellent (90+), Good (70-89), Fair (50-69), Poor (<50)

**Implementation:**
```python
# Pseudocode structure
def calculate_quality_score(image_path):
    img = load_image(image_path)

    # Technical metrics
    sharpness = laplacian_variance(img)
    resolution = get_megapixels(img)
    exposure = histogram_analysis(img)
    noise = estimate_noise(img)

    # Aesthetic metrics
    composition = rule_of_thirds_score(img)
    faces = detect_faces(img)  # bonus points
    vibrancy = color_saturation_score(img)

    # Weighted combination
    technical = (sharpness * 0.25 + resolution * 0.15 +
                 exposure * 0.10 + noise * 0.10) * 0.6
    aesthetic = (composition * 0.20 + vibrancy * 0.10) * 0.4

    return min(100, technical + aesthetic + face_bonus)
```

### 2. Similarity Detection

**Approach: Multi-Stage Pipeline**

#### Stage 1: Fast Filtering
- **Perceptual Hashing** (pHash via `imagehash` library)
- Hash all images, compute Hamming distances
- Threshold: Hamming distance < 10 = potential duplicate

#### Stage 2: Deep Comparison
For candidates from Stage 1:
- **Structural Similarity (SSIM)**: Pixel-level comparison
- **Feature Matching**: ORB/SIFT keypoint matching
- **Histogram Comparison**: Color distribution similarity

#### Stage 3: Grouping
- Cluster similar images into groups
- Use connected components or DBSCAN clustering
- Each group becomes a "Duplicates - Group N" album

**Similarity Categories:**
- **Exact Duplicates**: Hamming distance = 0 or SSIM > 0.99
- **Near Duplicates**: Different crops, edits, or slight variations (SSIM 0.85-0.99)
- **Similar**: Same scene/subject but different shots (SSIM 0.70-0.85)

**Implementation:**
```python
def find_similar_groups(photo_library):
    # Stage 1: Hash all images
    hashes = {photo: compute_phash(photo) for photo in photos}

    # Find candidates with similar hashes
    candidates = []
    for p1, p2 in combinations(photos, 2):
        if hamming_distance(hashes[p1], hashes[p2]) < 10:
            candidates.append((p1, p2))

    # Stage 2: Deep comparison
    similar_pairs = []
    for p1, p2 in candidates:
        ssim = compute_ssim(p1, p2)
        if ssim > 0.70:
            similar_pairs.append((p1, p2, ssim))

    # Stage 3: Group into clusters
    groups = cluster_similar_photos(similar_pairs)
    return groups
```

### 3. Photos App Integration

**Using AppleScript/JXA:**

```applescript
-- Create quality-ranked album
tell application "Photos"
    -- Create album
    make new album named "★ Quality Score - Best to Worst"

    -- Add photos in quality order
    repeat with photoID in sortedPhotoIDs
        set thePhoto to media item id photoID
        add {thePhoto} to album "★ Quality Score - Best to Worst"
    end repeat
end tell
```

**Album Structure:**
1. **Quality Album**: Single album with all photos, ordered by score
2. **Duplicate Albums**: One album per similar group
   - Album name: "🔍 Duplicates - Group 1 (5 photos)"
   - Contains only photos from that similarity cluster

---

## Technical Implementation Plan

### Phase 1: Core Analysis Engine

**Components:**

1. **Photo Library Reader**
   - Use AppleScript to export photo list with metadata
   - Alternative: Direct read from `~/Pictures/Photos Library.photoslibrary/`

2. **Image Quality Analyzer**
   - OpenCV for blur, exposure, noise detection
   - PIL for resolution and basic metrics
   - Optional: scikit-image for advanced analysis

3. **Similarity Detector**
   - `imagehash` library for perceptual hashing
   - OpenCV for SSIM and feature matching
   - Clustering algorithm for grouping

4. **Scoring Engine**
   - Combine metrics with configurable weights
   - Normalize scores to 0-100 scale
   - Cache results for re-runs

### Phase 2: Photos Integration

1. **Album Creator**
   - AppleScript bridge for album manipulation
   - Batch operations for performance

2. **Progress Reporting**
   - Terminal progress bar (tqdm library)
   - Estimated time remaining
   - Current processing stage

### Phase 3: Packaging & Distribution

1. **Script Optimization**
   - Multi-threading for image processing
   - Lazy loading for memory efficiency

2. **Standalone Executable**
   - PyInstaller to create .app bundle
   - Include all dependencies
   - Sign for macOS Gatekeeper

---

## Technology Stack

### Core Dependencies

```python
# requirements.txt
Pillow>=10.0.0           # Image loading and basic ops
opencv-python>=4.8.0     # Advanced image analysis
imagehash>=4.3.1         # Perceptual hashing
numpy>=1.24.0            # Numerical operations
scikit-image>=0.21.0     # Image processing algorithms
scikit-learn>=1.3.0      # Clustering (DBSCAN)
tqdm>=4.65.0             # Progress bars

# Optional (AI aesthetic scoring)
# tensorflow>=2.13.0 or torch>=2.0.0
# NIMA pre-trained model
```

### System Requirements
- macOS 12.0+ (Monterey or newer)
- Python 3.9+
- Read access to Photos library
- 4GB RAM minimum (8GB recommended for large libraries)

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Photo Scanner Tool                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. DISCOVERY PHASE                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AppleScript: Get all photos from Photos.app         │   │
│  │ Returns: List of photo IDs, paths, metadata         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ANALYSIS PHASE (Parallel Processing)                    │
│  ┌────────────────────┐  ┌────────────────────────────┐    │
│  │ Quality Scoring    │  │ Similarity Detection       │    │
│  │ - Blur detection   │  │ - Perceptual hashing       │    │
│  │ - Resolution       │  │ - SSIM comparison          │    │
│  │ - Exposure         │  │ - Feature matching         │    │
│  │ - Aesthetics       │  │ - Clustering               │    │
│  └────────────────────┘  └────────────────────────────┘    │
│           │                         │                        │
│           └──────────┬──────────────┘                        │
│                      ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Results Database (SQLite or JSON)                    │   │
│  │ - Photo ID → Quality Score                           │   │
│  │ - Similarity Groups                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ALBUM CREATION PHASE                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AppleScript: Create albums in Photos                │   │
│  │ - Quality album (sorted by score)                   │   │
│  │ - Duplicate group albums                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. COMPLETION                                               │
│  - Open Photos.app to new albums                            │
│  - Generate summary report                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
photo-scanner/
├── photo_scanner.py          # Main entry point
├── modules/
│   ├── __init__.py
│   ├── photos_bridge.py      # AppleScript integration
│   ├── quality_scorer.py     # Quality analysis
│   ├── similarity_detector.py # Duplicate detection
│   ├── album_creator.py      # Photos album management
│   └── utils.py              # Helpers, caching, config
├── requirements.txt          # Python dependencies
├── config.yaml               # User configuration
├── scripts/
│   └── photos_interface.scpt # AppleScript utilities
└── README.md                 # User guide
```

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**
   - Use multiprocessing for independent photo analysis
   - Thread pool for I/O-bound operations (image loading)

2. **Caching**
   - Cache computed hashes and scores
   - Skip reprocessing on subsequent runs
   - Store in SQLite database

3. **Lazy Loading**
   - Load images only when needed
   - Use thumbnails for perceptual hashing
   - Full resolution only for final quality checks

4. **Batch Operations**
   - Group AppleScript calls to reduce overhead
   - Bulk album updates instead of one-by-one

### Performance Targets

| Library Size | Expected Time | Memory Usage |
|--------------|---------------|--------------|
| 1,000 photos | 2-5 minutes   | 500MB        |
| 10,000 photos| 15-30 minutes | 2GB          |
| 50,000 photos| 1-2 hours     | 4GB          |

---

## Privacy & Security

### Data Handling
- **Read-only access**: Never modify original photos
- **Local processing**: All analysis happens on-device
- **No network calls**: No data leaves the machine
- **Temporary files**: Clean up after processing

### Permissions Required
- Full Disk Access (for Photos library)
- Photos app control (AppleScript)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Photos DB schema changes | High | Use AppleScript API instead of direct DB access |
| Large library performance | Medium | Implement resume capability, batch processing |
| AppleScript rate limits | Low | Add delays between bulk operations |
| Dependency bloat | Low | Minimize ML dependencies, make AI features optional |
| macOS version incompatibility | Medium | Test on multiple macOS versions, use compatibility checks |

---

## Future Enhancements (v2.0+)

### Advanced Features
- **Smart deletion suggestions**: Automatically suggest which duplicates to delete
- **Video support**: Analyze video quality and find duplicate videos
- **Face clustering**: Group photos by people
- **Location-based albums**: Create albums by location
- **Timeline gaps**: Identify missing photos (corrupted/deleted)
- **Export report**: HTML report with statistics and examples

### UI Improvements
- **Native Mac app**: SwiftUI interface
- **Preview before creation**: Show sample photos before making albums
- **Undo support**: Easy rollback of album creation
- **Scheduled scans**: Run automatically on schedule

### AI/ML Enhancements
- **Deep learning aesthetics**: Use NIMA or custom trained model
- **Scene classification**: Beach, mountain, food, etc.
- **Object detection**: Find photos containing specific objects
- **Emotion detection**: Smiling faces, action shots

---

## Success Criteria for v1.0

**Must Have:**
- ✅ Scan entire Photos library
- ✅ Generate quality scores for all photos
- ✅ Detect duplicate/similar photos with >90% accuracy
- ✅ Create quality-ranked album
- ✅ Create duplicate group albums
- ✅ Complete scan of 10k photos in <30 minutes
- ✅ Zero crashes or data loss

**Should Have:**
- Configuration file for adjustable thresholds
- Progress reporting with ETA
- Summary report at completion
- Resume capability for interrupted scans

**Could Have:**
- AI-based aesthetic scoring
- Face detection bonus
- HTML export report

---

## Development Roadmap

### Milestone 1: Proof of Concept (Week 1)
- Basic quality scoring on sample photos
- Perceptual hashing for similarity
- Manual album creation test

### Milestone 2: Core Engine (Week 2)
- Complete quality scoring pipeline
- Multi-stage similarity detection
- Caching and optimization

### Milestone 3: Photos Integration (Week 3)
- AppleScript bridge implementation
- Automated album creation
- Error handling and recovery

### Milestone 4: Polish & Package (Week 4)
- Performance optimization
- User documentation
- PyInstaller packaging
- Testing on various library sizes

---

## Appendices

### A. Quality Scoring Formula (Detailed)

```python
# Final quality score calculation
WEIGHTS = {
    'sharpness': 0.25,
    'resolution': 0.15,
    'exposure': 0.10,
    'noise': 0.10,
    'composition': 0.20,
    'vibrancy': 0.10,
    'faces': 0.10,  # bonus
}

# Normalization functions
def normalize_sharpness(laplacian_var):
    """Higher is better, threshold at 100"""
    return min(100, (laplacian_var / 500) * 100)

def normalize_resolution(megapixels):
    """Optimal at 12MP+, penalty below 2MP"""
    if megapixels >= 12:
        return 100
    elif megapixels < 2:
        return (megapixels / 2) * 50
    else:
        return 50 + ((megapixels - 2) / 10) * 50
```

### B. Perceptual Hash Comparison Thresholds

```python
# Hamming distance thresholds for different similarity levels
THRESHOLDS = {
    'identical': 0,      # Exact hash match
    'duplicate': 5,      # Likely exact duplicate or minimal crop
    'similar': 10,       # Same photo, different edit/exposure
    'related': 15,       # Similar scene or burst photo
}
```

### C. AppleScript Album Creation Template

```applescript
on createQualityAlbum(photoIDList)
    tell application "Photos"
        -- Delete existing album if present
        if (count of albums whose name is "★ Quality Score - Best to Worst") > 0 then
            delete album "★ Quality Score - Best to Worst"
        end if

        -- Create new album
        set qualityAlbum to make new album named "★ Quality Score - Best to Worst"

        -- Add photos in order
        repeat with photoID in photoIDList
            try
                set thePhoto to media item id photoID
                add {thePhoto} to qualityAlbum
            on error errMsg
                log "Error adding photo: " & errMsg
            end try
        end repeat
    end tell
end createQualityAlbum
```

---

## Questions for Stakeholder Review

1. **Quality metrics priority**: Which quality factors matter most to you? (sharpness, aesthetics, faces, etc.)
2. **Similarity sensitivity**: Prefer more groups (aggressive) or fewer groups (conservative)?
3. **Existing albums**: Should the tool work with specific albums or entire library?
4. **Deletion workflow**: Future feature to delete duplicates from within Photos?
5. **Performance**: Is 30 min scan time acceptable for 10k photos, or must be faster?

---

## Conclusion

This product brief outlines a comprehensive approach to building a Mac photo scanner tool. The Python + AppleScript hybrid approach balances simplicity, functionality, and maintainability while leveraging the rich Python ecosystem for image analysis.

**Next Steps:**
1. Review and approve this brief
2. Set up development environment
3. Build proof-of-concept with sample photos
4. Iterate based on real-world testing

**Estimated Development Time:** 3-4 weeks for v1.0
**Recommended Team Size:** 1 developer

---

*End of Product Brief*
