<div class="card-body p-4">
                    <form action="/admin/hotel/add?module=hotel&moduleId=hotel" method="POST"
                        enctype="multipart/form-data">
                        <div class="row g-4">
                            <!-- Left Column -->
                            <div class="col-lg-6">
                                <!-- Name -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Hotel Name <span
                                            class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white"><i
                                                class="fas fa-hotel text-muted"></i></span>
                                        <input type="text" name="name" id="name" class="form-control" maxlength="255"
                                            required placeholder="Enter hotel name" />
                                    </div>
                                </div>

                                <!-- Slug -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Slug <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white">
                                            <i class="fas fa-link text-muted"></i>
                                        </span>
                                        <input type="text" name="slug" id="slug" class="form-control" required
                                            placeholder="Enter URL slug" />
                                    </div>
                                </div>

                                <!-- Address -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Address</label>
                                    <textarea name="address" id="address" class="form-control" rows="2"
                                        placeholder="Hotel address"></textarea>
                                </div>

                                <!-- City -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">City <span class="text-danger">*</span></label>
                                    <select name="city_id" id="city_id" class="form-select" required>
                                        <% cities.forEach(city=> { %>
                                            <option value="<%= city.id %>">
                                                <%= city.name %>
                                            </option>
                                            <% }); %>
                                    </select>
                                </div>

                                <!-- Theme -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Theme</label>
                                    <select name="theme_id" id="theme_id" class="form-select">
                                        <option value="">--Select--</option>
                                        <% themes.forEach(theme=> { %>
                                            <option value="<%= theme.id %>">
                                                <%= theme.name %>
                                            </option>
                                            <% }); %>
                                    </select>
                                </div>

                                <!-- Star Rating -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Star Rating</label>
                                    <input type="number" name="star_rating" id="star_rating" class="form-control"
                                        min="1" max="5" placeholder="1-5"
                                        oninput="this.value = Math.min(5, Math.max(1, this.value))" />
                                </div>


                                <!-- Price -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Price/Night</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white">$</span>
                                        <input type="number" name="price_per_night" id="price_per_night"
                                            class="form-control" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <!-- Right Column -->
                            <div class="col-lg-6">
                                <!-- Main Image Upload -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Main Image</label>
                                    <div class="border rounded p-3 text-center bg-light">
                                        <div id="image-preview-container" class="mb-2" style="min-height: 120px;">
                                            <img id="image-preview" src="#" alt="Preview"
                                                class="img-fluid rounded d-none" style="max-height: 120px;">
                                            <div id="image-placeholder"
                                                class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                                <i class="fas fa-image fa-2x mb-2"></i>
                                                <span>Main image preview</span>
                                            </div>
                                        </div>
                                        <input type="file" class="form-control" name="image" id="image" accept="image/*"
                                            onchange="previewImage(event)">
                                        <small class="text-muted">Recommended: 800x600px, JPG or PNG</small>
                                    </div>
                                </div>

                                <!-- Additional Images -->
                                <div class="mb-3">
                                    <label class="form-label fw-medium">Additional Images</label>
                                    <div class="border rounded p-3 text-center bg-light">
                                        <div id="additional-images-preview" class="d-flex flex-wrap gap-2 mb-2">
                                            <div class="d-flex flex-column align-items-center justify-content-center w-100 text-muted"
                                                style="min-height: 80px;">
                                                <i class="fas fa-images fa-2x mb-2"></i>
                                                <span>Additional images preview</span>
                                            </div>
                                        </div>
                                        <input type="file" class="form-control" name="hotel_images" id="hotel_images"
                                            accept="image/*" multiple max="9" onchange="previewAdditionalImages(event)">
                                        <small class="text-muted">Select multiple images (max 9)</small>
                                    </div>
                                </div>

                                <!-- Contact Info -->
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label fw-medium">Phone</label>
                                            <div class="input-group">
                                                <span class="input-group-text bg-white"><i
                                                        class="fas fa-phone text-muted"></i></span>
                                                <input type="text" name="phone" maxlength="12" id="phone"
                                                    class="form-control" placeholder="Phone number" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label fw-medium">Email</label>
                                            <div class="input-group">
                                                <span class="input-group-text bg-white"><i
                                                        class="fas fa-envelope text-muted"></i></span>
                                                <input type="email" name="email" id="email" class="form-control"
                                                    placeholder="Email address" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="mb-3">
                                            <label class="form-label fw-medium">Website</label>
                                            <div class="input-group">
                                                <span class="input-group-text bg-white"><i
                                                        class="fas fa-globe text-muted"></i></span>
                                                <input type="url" name="website" id="website" class="form-control"
                                                    placeholder="Website URL" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Toggles -->
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="is_featured"
                                                id="is_featured" value="1">
                                            <label class="form-check-label fw-medium" for="is_featured">Featured
                                                Hotel</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" name="is_active"
                                                id="is_active" value="1" checked>
                                            <label class="form-check-label fw-medium" for="is_active">Active</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="mb-3">
                            <label class="form-label fw-medium">Short Description</label>
                            <textarea name="description" id="description" class="form-control" rows="3"
                                placeholder="Brief description of the hotel"></textarea>
                        </div>

                        <!-- Content Editor -->
                        <div class="mb-4">
                            <label class="form-label fw-medium">Full Content</label>
                            <div class="border rounded bg-white p-2">
                                <input type="hidden" name="content" id="content" />
                                <div id="editor" style="min-height: 300px; max-height: 300px; overflow-y: scroll;">
                                </div>
                            </div>
                        </div>

                        <!-- SEO Section -->
                        <div class="accordion mb-4" id="seoAccordion">
                            <div class="accordion-item border-0 shadow-sm">
                                <h2 class="accordion-header">
                                    <button class="accordion-button bg-light py-2 collapsed" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#seoCollapse">
                                        <i class="fas fa-search me-2 text-primary"></i>
                                        <span class="fw-medium">SEO Settings</span>
                                    </button>
                                </h2>
                                <div id="seoCollapse" class="accordion-collapse collapse"
                                    data-bs-parent="#seoAccordion">
                                    <div class="accordion-body pt-3">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label class="form-label fw-medium">Meta Title</label>
                                                    <input name="meta_title" id="meta_title" class="form-control"
                                                        placeholder="Optimized title (50-60 chars)" />
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label class="form-label fw-medium">Meta Keywords</label>
                                                    <input name="meta_keywords" id="meta_keywords" class="form-control"
                                                        placeholder="Comma-separated keywords" />
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="mb-0">
                                                    <label class="form-label fw-medium">Meta Description</label>
                                                    <textarea name="meta_description" id="meta_description"
                                                        class="form-control" rows="2"
                                                        placeholder="Brief summary (150-160 chars)"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Buttons -->
                        <div class="d-flex justify-content-between border-top pt-4">
                            <button type="reset" class="btn btn-outline-secondary">
                                <i class="fas fa-undo me-1"></i> Reset
                            </button>
                            <div>
                                <a href="/admin/hotel/hotel" class="btn btn-outline-danger me-2">
                                    <i class="fas fa-times me-1"></i> Cancel
                                </a>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i> Save Hotel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>