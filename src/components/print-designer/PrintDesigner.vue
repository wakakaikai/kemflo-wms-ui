<template>
  <div class="print-designer">
    <el-container class="pd-container">
      <el-aside width="268px" class="pd-aside pd-sidebar-left">
        <el-scrollbar max-height="calc(100vh - 140px)" class="pd-sidebar-scroll">
          <el-collapse v-model="leftCollapse" class="pd-collapse pd-sidebar-collapse">
            <el-collapse-item :title="t('printDesigner.canvas.paletteTitle')" name="widgets">
              <WidgetPanel :options="palette" />
            </el-collapse-item>

            <el-collapse-item :title="t('printDesigner.tabs.page')" name="page">
              <el-form label-position="top" size="small" class="pd-section-form">
                <el-form-item :label="t('printDesigner.canvas.templateTitle')">
                  <el-input v-model="template.title" />
                </el-form-item>
                <el-form-item :label="t('printDesigner.canvas.paperPreset')">
                  <el-select v-model="paperPresetSelection" class="w100" :placeholder="t('printDesigner.canvas.selectPlaceholder')">
                    <el-option value="custom" :label="t('printDesigner.canvas.paperPresetCustom')" />
                    <el-option v-for="p in PAPER_QUICK_PRESETS" :key="p.id" :value="p.id" :label="paperPresetLabel(p.id)" />
                  </el-select>
                  <div class="pd-form-hint">{{ t('printDesigner.canvas.paperPresetHint') }}</div>
                </el-form-item>
                <el-form-item :label="t('printDesigner.canvas.paperSizeMm')">
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-input-number v-model="template.pageWidth" :min="10" :step="1" controls-position="right" class="w100" />
                    </el-col>
                    <el-col :span="12">
                      <el-input-number v-model="template.pageHeight" :min="10" :step="1" controls-position="right" class="w100" />
                    </el-col>
                  </el-row>
                  <div class="pd-form-hint">{{ t('printDesigner.canvas.paperSizeSummary', { w: template.pageWidth, h: template.pageHeight, cw: template.width, ch: template.height }) }}</div>
                </el-form-item>
              </el-form>
            </el-collapse-item>

            <el-collapse-item :title="t('printDesigner.collapse.layers')" name="layers">
              <div v-if="sortedItems.length" class="layer-tags">
                <el-tag
                  v-for="item in sortedItems"
                  :key="item.id"
                  :type="selectedId === item.id ? 'primary' : 'info'"
                  :effect="selectedId === item.id ? 'dark' : 'plain'"
                  closable
                  class="layer-tag"
                  @click="selectedId = item.id"
                  @close.stop="removeItemById(item.id)"
                >
                  {{ itemTitle(item) }}
                </el-tag>
              </div>
              <el-empty v-else :description="t('printDesigner.canvas.layersEmpty')" :image-size="56" />
            </el-collapse-item>
          </el-collapse>
        </el-scrollbar>
      </el-aside>

      <el-main class="pd-main">
        <div class="pd-toolbar">
          <el-tooltip :content="t('printDesigner.canvas.preview')" placement="bottom" :show-after="300">
            <button type="button" class="pd-tool-btn" @click="handlePreview">
              <el-icon><View /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="t('printDesigner.canvas.save')" placement="bottom" :show-after="300">
            <button type="button" class="pd-tool-btn pd-tool-btn--primary" @click="emit('save', template)">
              <el-icon><Document /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="t('printDesigner.canvas.undo')" placement="bottom" :show-after="300">
            <button
              type="button"
              class="pd-tool-btn"
              :disabled="!canUndo"
              @click="performUndo"
            >
              <el-icon><RefreshLeft /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="t('printDesigner.canvas.redo')" placement="bottom" :show-after="300">
            <button
              type="button"
              class="pd-tool-btn"
              :disabled="!canRedo"
              @click="performRedo"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip :content="t('printDesigner.canvas.print')" placement="bottom" :show-after="300">
            <button type="button" class="pd-tool-btn pd-tool-btn--success" @click="handlePrint">
              <el-icon><Printer /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip
            v-if="selected"
            :content="t('printDesigner.canvas.deleteSelected')"
            placement="bottom"
            :show-after="300"
          >
            <button type="button" class="pd-tool-btn pd-tool-btn--danger" @click="removeSelected">
              <el-icon><Delete /></el-icon>
            </button>
          </el-tooltip>

          <template v-if="supportsTextFontStyle">
            <span class="pd-toolbar-sep" />
            <div class="pd-text-format-bar">
              <el-select
                v-model="fontNameProxy"
                class="pd-font-select pd-font-select--toolbar"
                filterable
                allow-create
                default-first-option
                clearable
                size="small"
                :placeholder="t('printDesigner.canvas.fontFamilyPh')"
              >
                <el-option
                  v-for="opt in mergedFontOptions"
                  :key="fontOptionKey(opt)"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-tooltip :content="t('printDesigner.canvas.loadLocalFonts')" placement="bottom" :show-after="300">
                <button
                  type="button"
                  class="pd-fmt-btn"
                  :disabled="loadingLocalFonts"
                  @click="loadInstalledFonts"
                >
                  <el-icon class="pd-fmt-icon"><Refresh /></el-icon>
                </button>
              </el-tooltip>
              <el-select
                v-model="fontSizeProxy"
                class="pd-font-size-select"
                filterable
                allow-create
                default-first-option
                size="small"
                :placeholder="t('printDesigner.canvas.fontPt')"
              >
                <el-option
                  v-for="sz in fontSizePresets"
                  :key="sz"
                  :label="String(sz)"
                  :value="sz"
                />
              </el-select>
              <span class="pd-fmt-divider" />
              <el-tooltip :content="t('printDesigner.canvas.bold')" placement="bottom" :show-after="300">
                <button
                  type="button"
                  class="pd-fmt-btn pd-fmt-btn--bold"
                  :class="{ active: boldProxy }"
                  @click="boldProxy = !boldProxy"
                >B</button>
              </el-tooltip>
              <el-tooltip :content="t('printDesigner.canvas.italic')" placement="bottom" :show-after="300">
                <button
                  type="button"
                  class="pd-fmt-btn pd-fmt-btn--italic"
                  :class="{ active: italicProxy }"
                  @click="italicProxy = !italicProxy"
                >I</button>
              </el-tooltip>
              <el-tooltip :content="t('printDesigner.canvas.underline')" placement="bottom" :show-after="300">
                <button
                  type="button"
                  class="pd-fmt-btn pd-fmt-btn--underline"
                  :class="{ active: underlineProxy }"
                  @click="underlineProxy = !underlineProxy"
                >U</button>
              </el-tooltip>
              <el-tooltip :content="t('printDesigner.canvas.strikethrough')" placement="bottom" :show-after="300">
                <button
                  type="button"
                  class="pd-fmt-btn pd-fmt-btn--strike"
                  :class="{ active: strikeoutProxy }"
                  @click="strikeoutProxy = !strikeoutProxy"
                >S</button>
              </el-tooltip>
              <el-tooltip :content="t('printDesigner.canvas.fontColor')" placement="bottom" :show-after="300">
                <span class="pd-fmt-color">
                  <PrintColorPicker v-model="fontColorProxy" compact-icon="font" />
                </span>
              </el-tooltip>
              <el-tooltip :content="t('printDesigner.canvas.highlightColor')" placement="bottom" :show-after="300">
                <span class="pd-fmt-color">
                  <PrintColorPicker
                    v-model="highlightColorProxy"
                    compact-icon="highlight"
                    show-transparent
                  />
                </span>
              </el-tooltip>
            </div>
          </template>

          <template v-if="supportsLineStyleBar">
            <span class="pd-toolbar-sep" />
            <div class="pd-text-format-bar">
              <el-tooltip :content="t('printDesigner.canvas.lineColor')" placement="bottom" :show-after="300">
                <span class="pd-fmt-color">
                  <PrintColorPicker v-model="borderColorProxy" compact-icon="pencil" />
                </span>
              </el-tooltip>
              <el-dropdown
                trigger="click"
                placement="bottom"
                :teleported="false"
                popper-class="pd-line-style-dropdown"
                @command="lineStyleProxy = $event"
              >
                <el-tooltip :content="t('printDesigner.canvas.lineStyle')" placement="bottom" :show-after="300">
                  <button type="button" class="pd-fmt-btn pd-fmt-line-btn">
                    <span class="pd-fmt-line-btn__preview">
                      <span
                        v-for="(_, i) in 3"
                        :key="i"
                        class="pd-line-style-preview"
                        :class="`pd-line-style-preview--${currentLineStyleKey}`"
                      />
                    </span>
                  </button>
                </el-tooltip>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="opt in lineStyleSelectOptions"
                      :key="opt.value"
                      :command="opt.value"
                      :class="{ 'is-active': lineStyleProxy === opt.value }"
                    >
                      <span class="pd-line-style-item">
                        <span class="pd-line-style-preview" :class="`pd-line-style-preview--${opt.key}`" />
                        <span class="pd-line-style-label">{{ opt.label }}</span>
                      </span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </div>
        <div class="canvas-scroll">
          <div
            class="design-page"
            :style="{
              width: `${template.width}px`,
              height: `${template.height}px`
            }"
            @mousedown.self="clearSelect"
            @dragover="onCanvasDragOver"
            @drop="onCanvasDrop"
          >
            <template v-for="(g, gi) in alignGuides" :key="`g-${gi}`">
              <div
                v-if="g.orientation === 'v'"
                class="pd-align-guide pd-align-guide--v"
                :style="{ left: `${g.position}px` }"
              />
              <div
                v-else
                class="pd-align-guide pd-align-guide--h"
                :style="{ top: `${g.position}px` }"
              />
            </template>
            <template v-for="item in sortedItems" :key="item.id">
              <div
                v-if="isShapeItem(item)"
                class="pd-item pd-item-shape"
                :class="{
                  active: selectedId === item.id,
                  'pd-item-shape--ellipse': item.type === 'braid-ellipse',
                  'pd-item-shape--border': isBorderFrameItem(item)
                }"
                :style="itemStyle(item)"
                @mousedown.stop="(e) => onItemDown(e, item)"
              >
                <span class="pd-item-label">{{ itemTitle(item) }}</span>
                <div class="pd-shape-preview" :style="shapePreviewStyle(item)" />
                <span
                  v-if="item.resizable !== false && selectedId === item.id"
                  class="resize-handle"
                  @mousedown.stop="(e) => onResizeDown(e, item)"
                />
              </div>
              <div
                v-else-if="isLineItem(item)"
                class="pd-item pd-item-line"
                :class="{ active: selectedId === item.id, 'pd-item-line--v': getLineOrientation(item) === 'v' }"
                :style="itemStyle(item)"
                @mousedown.stop="(e) => onItemDown(e, item)"
              >
                <span class="pd-item-label">{{ itemTitle(item) }}</span>
                <div class="pd-line-preview" :style="linePreviewStyle(item)" />
                <span
                  v-if="item.resizable !== false && selectedId === item.id"
                  class="resize-handle"
                  @mousedown.stop="(e) => onResizeDown(e, item)"
                />
              </div>
              <div
                v-else-if="item.type !== 'braid-table'"
                class="pd-item"
                :class="{ active: selectedId === item.id }"
                :style="itemStyle(item)"
                @mousedown.stop="(e) => onItemDown(e, item)"
              >
                <span v-if="!isTextItem(item)" class="pd-item-label">{{ itemTitle(item) }}</span>
                <div
                  class="pd-item-body"
                  :class="{
                    'pd-item-body--barcode': item.type === 'bar-code',
                    'pd-item-body--text': isTextItem(item)
                  }"
                >
                  <BarcodeCanvasPreview
                    v-if="item.type === 'bar-code'"
                    :item="item"
                    :data-row="demoData[0] || {}"
                  />
                  <span v-else-if="isTextItem(item)" class="pd-text-preview" :style="previewTextStyle(item)">{{
                    previewText(item)
                  }}</span>
                  <template v-else>{{ previewText(item) }}</template>
                </div>
                <span
                  v-if="item.resizable !== false && selectedId === item.id"
                  class="resize-handle"
                  @mousedown.stop="(e) => onResizeDown(e, item)"
                />
              </div>
              <div
                v-else
                class="pd-item pd-item-table"
                :class="{ active: selectedId === item.id }"
                :style="itemStyle(item)"
                @mousedown.stop="(e) => onItemDown(e, item)"
              >
                <span class="pd-item-label">{{ itemTitle(item) }}</span>
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th
                        v-for="(c, ci) in item.columnsAttr || []"
                        :key="ci"
                        :style="tableCellBorderStyle(item, 0, ci)"
                      >
                        {{ columnTitle(c) }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, ri) in tablePreviewRows(item)" :key="ri">
                      <td
                        v-for="(c, ci) in item.columnsAttr || []"
                        :key="ci"
                        :style="tableCellBorderStyle(item, ri + 1, ci)"
                      >
                        {{ r[c.name || ''] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <span
                  v-if="item.resizable !== false && selectedId === item.id"
                  class="resize-handle"
                  @mousedown.stop="(e) => onResizeDown(e, item)"
                />
              </div>
            </template>
          </div>
        </div>
      </el-main>

      <el-aside width="320px" class="pd-aside pd-sidebar-right">
        <el-scrollbar max-height="calc(100vh - 140px)" class="pd-sidebar-scroll">
          <el-collapse v-model="rightCollapse" class="pd-collapse pd-sidebar-collapse">
            <el-collapse-item :title="t('printDesigner.tabs.style')" name="style">
              <template v-if="selected">
                <el-form label-position="top" size="small" class="pd-section-form">
                  <el-divider content-position="left">{{ t('printDesigner.canvas.sectionContent') }}</el-divider>
                  <el-form-item :label="t('printDesigner.canvas.itemTitle')">
                    <el-input v-model="selected.title" />
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.dataField')">
                    <el-input v-model="selected.name" :placeholder="t('printDesigner.canvas.dataFieldPh')" clearable />
                  </el-form-item>
                  <el-form-item
                    v-if="
                      selected.type === 'braid-txt' ||
                      selected.type === 'bar-code' ||
                      (selected.type === 'braid-html' && !isLineItem(selected))
                    "
                    :label="t('printDesigner.canvas.value')"
                  >
                    <el-input v-model="selected.value" type="textarea" :rows="3" />
                    <div v-if="selected.type === 'bar-code'" class="pd-form-hint">{{ t('printDesigner.canvas.barcodeValueHint') }}</div>
                  </el-form-item>
                  <el-form-item v-if="selected.type === 'braid-image'" :label="t('printDesigner.canvas.imageUrl')">
                    <el-input v-model="selected.value" type="textarea" :rows="2" />
                  </el-form-item>

                  <template
                    v-if="selected.type === 'braid-ellipse' || isBorderFrameItem(selected)"
                  >
                    <el-divider content-position="left">{{ t('printDesigner.canvas.sectionShape') }}</el-divider>
                    <el-form-item :label="t('printDesigner.canvas.shapeFill')">
                      <PrintColorPicker v-model="fillColorProxy" show-transparent />
                    </el-form-item>
                  </template>

                  <el-divider content-position="left">{{ t('printDesigner.canvas.sectionGeometry') }}</el-divider>
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.width')">
                        <el-input-number v-model="selected.width" :min="20" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.height')">
                        <el-input-number v-model="selected.height" :min="20" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.coordX')">
                        <el-input-number v-model="selected.left" :min="0" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.coordY')">
                        <el-input-number v-model="selected.top" :min="0" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <template v-if="selected.type === 'braid-table'">
                    <el-form-item label-width="0" class="pd-border-form-item">
                      <PrintBorderPanel
                        v-model:border-preset="borderPresetProxy"
                        v-model:border-color="borderColorProxy"
                        v-model:line-style="lineStyleProxy"
                        v-model:line-width="lineWidthProxy"
                        table-mode
                      />
                    </el-form-item>
                    <el-divider content-position="left">{{ t('printDesigner.canvas.sectionPagination') }}</el-divider>
                    <el-form-item :label="t('printDesigner.canvas.paginateAuto')">
                      <el-switch v-model="paginateProxy" />
                      <span class="pd-form-hint pd-form-hint--inline">{{ t('printDesigner.canvas.paginateAutoHint') }}</span>
                    </el-form-item>
                    <el-form-item v-if="paginateProxy" :label="t('printDesigner.canvas.pageRows')">
                      <el-input-number
                        v-model="pageRowsProxy"
                        :min="1"
                        :max="500"
                        :step="1"
                        controls-position="right"
                        class="w100"
                      />
                      <div class="pd-form-hint">{{ t('printDesigner.canvas.pageRowsHint') }}</div>
                    </el-form-item>
                  </template>
                  <template v-if="selected.type === 'bar-code'">
                    <el-divider content-position="left">{{ selectedBarcodeSectionTitle }}</el-divider>
                    <el-form-item :label="t('printDesigner.canvas.barcodeType')">
                      <el-select
                        v-model="codeTypeProxy"
                        class="w100"
                        filterable
                        :placeholder="t('printDesigner.canvas.selectPlaceholder')"
                      >
                        <el-option-group
                          v-for="group in activeBarcodeTypeGroups"
                          :key="group.groupKey"
                          :label="t(`printDesigner.barcodeTypes.${group.groupKey}`)"
                        >
                          <el-option v-for="opt in group.options" :key="opt.value" :label="opt.value" :value="opt.value" />
                        </el-option-group>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="t('printDesigner.canvas.barcodeShowValue')">
                      <el-switch v-model="showBarTextProxy" />
                    </el-form-item>
                    <el-form-item v-if="showBarTextProxy" :label="t('printDesigner.canvas.barcodeTextPosition')">
                      <el-select v-model="barCodeTextPositionProxy" class="w100">
                        <el-option :label="t('printDesigner.canvas.barcodeTextPosBottom')" :value="0" />
                        <el-option :label="t('printDesigner.canvas.barcodeTextPosTop')" :value="1" />
                        <el-option :label="t('printDesigner.canvas.barcodeTextPosLeft')" :value="2" />
                        <el-option :label="t('printDesigner.canvas.barcodeTextPosRight')" :value="3" />
                      </el-select>
                    </el-form-item>
                    <el-divider content-position="left">{{ t('printDesigner.canvas.sectionBarcodeLodop') }}</el-divider>
                    <el-form-item :label="t('printDesigner.canvas.barcodeBgColor')">
                      <div class="pd-barcode-bg-row">
                        <PrintColorPicker v-model="barcodeBgColorProxy" :disabled="barcodeBgTransparentProxy" />
                        <el-checkbox v-model="barcodeBgTransparentProxy">{{ t('printDesigner.canvas.barcodeBgTransparent') }}</el-checkbox>
                      </div>
                    </el-form-item>
                    <el-form-item :label="t('printDesigner.canvas.dataCharset')">
                      <el-select
                        v-model="dataCharsetProxy"
                        class="w100"
                        filterable
                        clearable
                        :placeholder="t('printDesigner.canvas.selectPlaceholder')"
                      >
                        <el-option v-for="cs in LODOP_DATA_CHARSETS" :key="cs" :label="cs" :value="cs" />
                      </el-select>
                    </el-form-item>
                    <template v-if="isSelectedBarcode2d">
                      <el-form-item :label="t('printDesigner.canvas.qrCodeVersion')">
                        <el-select v-model="qrCodeVersionProxy" class="w100">
                          <el-option :label="t('printDesigner.canvas.qrCodeVersionAuto')" value="" />
                          <el-option v-for="ver in QR_CODE_VERSIONS" :key="ver" :label="`V${ver}`" :value="String(ver)" />
                        </el-select>
                      </el-form-item>
                      <el-form-item :label="t('printDesigner.canvas.qrCodeErrorLevel')">
                        <el-select v-model="qrCodeErrorLevelProxy" class="w100">
                          <el-option label="L (7%)" value="L" />
                          <el-option label="M (15%)" value="M" />
                          <el-option label="Q (25%)" value="Q" />
                          <el-option label="H (30%)" value="H" />
                        </el-select>
                      </el-form-item>
                    </template>
                  </template>

                  <el-divider content-position="left">{{ t('printDesigner.canvas.sectionLayout') }}</el-divider>
                  <el-form-item :label="t('printDesigner.canvas.printType')">
                    <el-select v-model="itemTypeSelectProxy" class="w100">
                      <el-option :label="t('printDesigner.canvas.printTypeDefault')" value="" />
                      <el-option :label="t('printDesigner.canvas.printTypeNormal')" value="0" />
                      <el-option :label="t('printDesigner.canvas.printTypePageHeader')" value="1" />
                      <el-option :label="t('printDesigner.canvas.printTypePageNo')" value="2" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.hOrient')">
                    <el-select v-model="hOrientProxy" class="w100">
                      <el-option :label="t('printDesigner.canvas.anchorLeft')" :value="0" />
                      <el-option :label="t('printDesigner.canvas.anchorRight')" :value="1" />
                      <el-option :label="t('printDesigner.canvas.anchorHCenter')" :value="2" />
                      <el-option :label="t('printDesigner.canvas.anchorHStretch')" :value="3" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.vOrient')">
                    <el-select v-model="vOrientProxy" class="w100">
                      <el-option :label="t('printDesigner.canvas.anchorTop')" :value="0" />
                      <el-option :label="t('printDesigner.canvas.anchorBottom')" :value="1" />
                      <el-option :label="t('printDesigner.canvas.anchorVCenter')" :value="2" />
                      <el-option :label="t('printDesigner.canvas.anchorVStretch')" :value="3" />
                    </el-select>
                  </el-form-item>
                  <el-row :gutter="8">
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.scalX')">
                        <el-input-number v-model="scalXProxy" :min="0.1" :max="3" :step="0.01" :precision="2" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="t('printDesigner.canvas.scalY')">
                        <el-input-number v-model="scalYProxy" :min="0.1" :max="3" :step="0.01" :precision="2" controls-position="right" class="w100" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-form-item :label="t('printDesigner.canvas.linkedItem')">
                    <el-input v-model="linkedItemProxy" :placeholder="t('printDesigner.canvas.linkedItemPh')" clearable />
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.align')">
                    <el-select v-model="alignProxy" class="w100">
                      <el-option :label="t('printDesigner.canvas.alignLeft')" value="left" />
                      <el-option :label="t('printDesigner.canvas.alignCenter')" value="center" />
                      <el-option :label="t('printDesigner.canvas.alignRight')" value="right" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.autoHeight')">
                    <el-switch v-model="autoHeightProxy" />
                  </el-form-item>
                  <el-form-item :label="t('printDesigner.canvas.bottomMargin')">
                    <el-input-number v-model="bottomMarginProxy" :min="0" :step="1" controls-position="right" class="w100" />
                  </el-form-item>
                  <el-form-item label="zIndex">
                    <el-input-number v-model="zIndexProxy" controls-position="right" class="w100" />
                  </el-form-item>
                </el-form>
              </template>
              <el-empty v-else :description="t('printDesigner.canvas.selectItem')" :image-size="64" />
            </el-collapse-item>
          </el-collapse>
        </el-scrollbar>
      </el-aside>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  Delete,
  Document,
  Printer,
  RefreshLeft,
  RefreshRight,
  View
} from '@element-plus/icons-vue';
import WidgetPanel from './components/panel/WidgetPanel.vue';
import BarcodeCanvasPreview from './components/BarcodeCanvasPreview.vue';
import PrintColorPicker from './components/PrintColorPicker.vue';
import PrintBorderPanel from './components/PrintBorderPanel.vue';
import { lodopPrint, waitForLodopReady } from './libs/lodop';
import { defaultWidgetOptions, ensureShapePaletteWidgets } from './const/defaultWidgets';
import { mergePrintFontSelectOptions, normalizeFontFamilyName } from './const/printFonts';
import { PAPER_QUICK_PRESETS, canvasPxFromPaper, findMatchingPaperPreset } from './const/paperPresets';
import {
  LODOP_BARCODE_1D_GROUPS,
  LODOP_BARCODE_2D_GROUPS,
  is1dBarcodeType,
  is2dBarcodeType
} from './const/lodopBarcodeTypes';
import { LODOP_DATA_CHARSETS } from './const/lodopDataCharsets';
import { queryInstalledFontFamilies, supportsLocalFontsQuery } from './utils/localFonts';
import { tryGetLodopFontFamilies } from './utils/lodopFonts';
import {
  PRINT_WIDGET_DRAG_MIME,
  type BorderPreset,
  type LodopLicenseInfo,
  type PrintTemplate,
  type PrintTemplateItem,
  type TableColumnAttr,
  type WidgetOption
} from './types';
import { defaultBorderPresetForItem, previewTableCellBorderStyle } from './utils/itemBorderStyle';
import { resolveTextItemValue } from './utils/resolvePlaceholders';
import { resolveBarcodeItemValue } from './utils/lodopBarcodeValue';
import { isBorderFrameItem, isShapeItem, shapePreviewStyle } from './utils/shapeItems';
import {
  getLineOrientation,
  isLineItem,
  linePreviewStyle,
  normalizeLineTemplateItem
} from './utils/lineItems';

const { t, locale } = useI18n();

function paperPresetLabel(id: string) {
  return t(`printDesigner.paperPresets.${id}`);
}

/** Left: widgets / page / layers; right: style */
const leftCollapse = ref(['widgets', 'page', 'layers']);
const rightCollapse = ref(['style']);

const template = defineModel<PrintTemplate>({ required: true });

function syncCanvasPxFromPaper() {
  const px = canvasPxFromPaper(
    Math.max(Number(template.value.pageWidth) || 210, 10),
    Math.max(Number(template.value.pageHeight) || 297, 10)
  );
  template.value.width = px.width;
  template.value.height = px.height;
}

function syncPaperPresetIdFromMm() {
  const matched = findMatchingPaperPreset(template.value.pageWidth, template.value.pageHeight);
  paperPresetId.value = matched ?? 'custom';
}

/** User-selected preset id; stays `custom` until mm matches a preset again. */
const paperPresetId = ref(
  findMatchingPaperPreset(template.value.pageWidth, template.value.pageHeight) ?? 'custom'
);

const paperPresetSelection = computed({
  get(): string {
    return paperPresetId.value;
  },
  set(id: string) {
    paperPresetId.value = id;
  }
});

watch(
  () => [template.value.pageWidth, template.value.pageHeight] as const,
  () => {
    syncCanvasPxFromPaper();
    if (paperPresetId.value !== 'custom') {
      syncPaperPresetIdFromMm();
    }
  }
);

const props = withDefaults(
  defineProps<{
    /** Widget definitions; can be loaded from API */
    widgetOptions?: WidgetOption[];
    lodopLicense?: LodopLicenseInfo;
    /** Print rows; one page per row */
    printData?: Record<string, unknown>[];
  }>(),
  {
    widgetOptions: () => defaultWidgetOptions,
    printData: () => []
  }
);

const emit = defineEmits<{
  save: [PrintTemplate];
}>();

const palette = computed(() => ensureShapePaletteWidgets(props.widgetOptions));

watch(
  () => props.lodopLicense,
  (lic) => {
    lodopPrint.setLicenses(lic);
  },
  { immediate: true }
);

function newId() {
  return `pi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ensureItemIds() {
  for (const it of template.value.tempItems) {
    if (!it.id) it.id = newId();
  }
}

onMounted(() => ensureItemIds());

watch(
  () => template.value.tempItems.length,
  () => ensureItemIds()
);

const selectedId = ref<string | null>(null);

/**
 * Undo / redo history stack of `template` snapshots.
 * Watches the template deeply with a debounce and skips the
 * watcher when we are the ones applying a history snapshot.
 */
const HISTORY_LIMIT = 50;
const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);
let lastSnapshot = snapshotTemplate(template.value);
let suppressHistory = false;
let historyTimer: ReturnType<typeof setTimeout> | null = null;

function snapshotTemplate(t: PrintTemplate): string {
  return JSON.stringify(t);
}

function pushHistory() {
  const cur = snapshotTemplate(template.value);
  if (cur === lastSnapshot) return;
  undoStack.value.push(lastSnapshot);
  if (undoStack.value.length > HISTORY_LIMIT) undoStack.value.shift();
  redoStack.value = [];
  lastSnapshot = cur;
}

function applySnapshot(snap: string) {
  suppressHistory = true;
  template.value = JSON.parse(snap) as PrintTemplate;
  lastSnapshot = snap;
  if (selectedId.value && !template.value.tempItems.some((i) => i.id === selectedId.value)) {
    selectedId.value = null;
  }
  requestAnimationFrame(() => {
    suppressHistory = false;
  });
}

const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

function performUndo() {
  if (!canUndo.value) {
    ElMessage.info(t('printDesigner.canvas.undoEmpty'));
    return;
  }
  const prev = undoStack.value.pop();
  if (!prev) return;
  redoStack.value.push(lastSnapshot);
  applySnapshot(prev);
}

function performRedo() {
  if (!canRedo.value) {
    ElMessage.info(t('printDesigner.canvas.redoEmpty'));
    return;
  }
  const next = redoStack.value.pop();
  if (!next) return;
  undoStack.value.push(lastSnapshot);
  applySnapshot(next);
}

watch(
  () => template.value,
  () => {
    if (suppressHistory) return;
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
      historyTimer = null;
      pushHistory();
    }, 350);
  },
  { deep: true }
);

const sortedItems = computed(() =>
  [...template.value.tempItems].sort((a, b) => (a.style?.zIndex ?? 0) - (b.style?.zIndex ?? 0))
);

const selected = computed(() => template.value.tempItems.find((i) => i.id === selectedId.value) ?? null);

const loadedLocalFamilies = ref<string[]>([]);
const loadingLocalFonts = ref(false);

const mergedFontOptions = computed(() =>
  mergePrintFontSelectOptions(loadedLocalFamilies.value, locale.value, t)
);

function fontOptionKey(opt: { label: string; value: string }) {
  return `${opt.value}\u0000${opt.label}`;
}

async function loadInstalledFonts() {
  loadingLocalFonts.value = true;
  try {
    const fromLodop = tryGetLodopFontFamilies();
    let fromBrowser: string[] = [];
    if (supportsLocalFontsQuery()) {
      try {
        fromBrowser = await queryInstalledFontFamilies();
      } catch {
        /* ignore ?? handled below when merge empty */
      }
    }

    const merged = [
      ...new Set(
        [...fromLodop, ...fromBrowser]
          .map((f) => normalizeFontFamilyName(f))
          .filter((f): f is string => !!f)
      )
    ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    loadedLocalFamilies.value = merged;

    if (!merged.length) {
      ElMessage.info(t('printDesigner.canvas.localFontsNone'));
      return;
    }

    ElMessage.success(
      t('printDesigner.canvas.localFontsLoadedDetail', {
        count: merged.length,
        lodop: fromLodop.length,
        browser: fromBrowser.length
      })
    );
  } catch {
    ElMessage.error(t('printDesigner.canvas.localFontsFailed'));
  } finally {
    loadingLocalFonts.value = false;
  }
}

const fontSizePresets = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];
const fontSizeProxy = computed({
  get: () => selected.value?.style?.FontSize ?? 9,
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || n <= 0) return;
    const clamped = Math.max(6, Math.min(200, Math.round(n)));
    selected.value.style.FontSize = clamped;
  }
});

const fontNameProxy = computed({
  get: () => selected.value?.style?.FontName ?? '',
  set: (v: string | null | undefined) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const s = (v ?? '').trim();
    if (s) selected.value.style.FontName = s;
    else delete selected.value.style.FontName;
  }
});

const boldProxy = computed({
  get: () => !!selected.value?.style?.Bold,
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.Bold = v;
  }
});

const alignProxy = computed({
  get: () => selected.value?.style?.Alignment ?? 'left',
  set: (v: string) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const a = v === 'center' || v === 'right' ? v : 'left';
    selected.value.style.Alignment = a;
  }
});

const isSelectedBarcode2d = computed(() => is2dBarcodeType(selected.value?.style?.codeType));

/** Text/font props apply to text & 1D barcode captions only; QR/2D barcodes do not support Lodop font settings. */
const supportsTextFontStyle = computed(() => {
  const item = selected.value;
  if (!item || isShapeItem(item) || item.type === 'braid-image') return false;
  if (item.type === 'bar-code' && isSelectedBarcode2d.value) return false;
  return true;
});

/** Line color + style toolbar applies to drawn shapes & line widgets (not tables). */
const supportsLineStyleBar = computed(() => {
  const item = selected.value;
  if (!item) return false;
  return isBorderFrameItem(item) || isShapeItem(item) || isLineItem(item);
});

function clearTextFontStyle(style: NonNullable<PrintTemplateItem['style']>) {
  delete style.FontName;
  delete style.FontSize;
  delete style.Bold;
  delete style.Italic;
  delete style.Underline;
  delete style.StrikeOut;
  delete style.FontColor;
  delete style.HighlightColor;
  delete style.Alignment;
}

watch(
  () => selected.value?.id,
  () => {
    const item = selected.value;
    if (item?.type === 'bar-code' && is2dBarcodeType(item.style?.codeType) && item.style) {
      clearTextFontStyle(item.style);
    }
  }
);

const selectedBarcodeSectionTitle = computed(() =>
  isSelectedBarcode2d.value ? t('printDesigner.canvas.sectionBarcode2d') : t('printDesigner.canvas.sectionBarcode1d')
);

const activeBarcodeTypeGroups = computed(() =>
  isSelectedBarcode2d.value ? LODOP_BARCODE_2D_GROUPS : LODOP_BARCODE_1D_GROUPS
);

const codeTypeProxy = computed({
  get: () => {
    const raw = selected.value?.style?.codeType;
    if (isSelectedBarcode2d.value) {
      return raw && is2dBarcodeType(raw) ? raw : 'QRCode';
    }
    return raw && is1dBarcodeType(raw) ? raw : '128Auto';
  },
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.codeType = v;
    if (is2dBarcodeType(v)) {
      clearTextFontStyle(selected.value.style);
      selected.value.style.ShowBarText = false;
    }
  }
});

const zIndexProxy = computed({
  get: () => selected.value?.style?.zIndex ?? 0,
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.zIndex = v;
  }
});

const italicProxy = computed({
  get: () => !!selected.value?.style?.Italic,
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.Italic = v;
  }
});

const underlineProxy = computed({
  get: () => !!selected.value?.style?.Underline,
  set: (v) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.Underline = v;
  }
});

const fontColorProxy = computed({
  get: () => selected.value?.style?.FontColor || '#303133',
  set: (v: string | null) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.FontColor = v || '#303133';
  }
});

const strikeoutProxy = computed({
  get: () => !!selected.value?.style?.StrikeOut,
  set: (v: boolean) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.StrikeOut = v;
  }
});

const highlightColorProxy = computed({
  get: () => selected.value?.style?.HighlightColor || '',
  set: (v: string | null) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const s = (v || '').trim();
    if (!s || s === 'transparent') delete selected.value.style.HighlightColor;
    else selected.value.style.HighlightColor = s;
  }
});

const showBarTextProxy = computed({
  get: () => {
    const v = selected.value?.style?.ShowBarText;
    if (v === true) return true;
    if (v === false) return false;
    return !isSelectedBarcode2d.value;
  },
  set: (v: boolean) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.ShowBarText = v;
    if (v && selected.value.style.BarCodeTextPosition == null) {
      selected.value.style.BarCodeTextPosition = 0;
    }
  }
});

const barCodeTextPositionProxy = computed({
  get: () => selected.value?.style?.BarCodeTextPosition ?? 0,
  set: (v: 0 | 1 | 2 | 3) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.BarCodeTextPosition = v;
  }
});

const QR_CODE_VERSIONS = [1, 2, 3, 5, 7, 10, 14] as const;

const barcodeBgColorProxy = computed({
  get: () => selected.value?.style?.BarcodeBgColor || '#ffffff',
  set: (v: string | null) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.BarcodeBgColor = v || undefined;
  }
});

const barcodeBgTransparentProxy = computed({
  get: () => !!selected.value?.style?.BarcodeBgTransparent,
  set: (v: boolean) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.BarcodeBgTransparent = v;
  }
});

const dataCharsetProxy = computed({
  get: () => selected.value?.style?.DataCharset ?? '',
  set: (v: string) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    if (v) selected.value.style.DataCharset = v;
    else delete selected.value.style.DataCharset;
  }
});

const qrCodeVersionProxy = computed({
  get: () => {
    const v = selected.value?.style?.QRCodeVersion;
    if (v == null || v === 0) return '';
    return String(v);
  },
  set: (v: string) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    if (v === '') delete selected.value.style.QRCodeVersion;
    else selected.value.style.QRCodeVersion = Number(v);
  }
});

const qrCodeErrorLevelProxy = computed({
  get: () => selected.value?.style?.QRCodeErrorLevel ?? 'M',
  set: (v: 'L' | 'M' | 'Q' | 'H') => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.QRCodeErrorLevel = v;
  }
});

function orientProxy(key: 'HOrient' | 'VOrient', fallback: 0 | 1 | 2 | 3) {
  return computed({
    get: () => (selected.value?.style?.[key] ?? fallback) as 0 | 1 | 2 | 3,
    set: (v: 0 | 1 | 2 | 3) => {
      if (!selected.value) return;
      if (!selected.value.style) selected.value.style = {};
      selected.value.style[key] = v;
    }
  });
}

const hOrientProxy = orientProxy('HOrient', 0);
const vOrientProxy = orientProxy('VOrient', 0);

function scaleProxy(key: 'ScalX' | 'ScalY', fallback: number) {
  return computed({
    get: () => selected.value?.style?.[key] ?? fallback,
    set: (v: number | undefined) => {
      if (!selected.value) return;
      if (!selected.value.style) selected.value.style = {};
      if (v == null || v === 1) delete selected.value.style[key];
      else selected.value.style[key] = v;
    }
  });
}

const scalXProxy = scaleProxy('ScalX', 1);
const scalYProxy = scaleProxy('ScalY', 1);

const linkedItemProxy = computed({
  get: () => selected.value?.style?.LinkedItem ?? '',
  set: (v: string) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const s = v.trim();
    if (s) selected.value.style.LinkedItem = s;
    else delete selected.value.style.LinkedItem;
  }
});

const borderPresetProxy = computed({
  get: (): BorderPreset => {
    if (!selected.value) return 'none';
    return selected.value.style?.borderPreset ?? defaultBorderPresetForItem(selected.value);
  },
  set: (v: BorderPreset) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const def = defaultBorderPresetForItem(selected.value);
    if (v === def) delete selected.value.style.borderPreset;
    else selected.value.style.borderPreset = v;
  }
});

const borderColorProxy = computed({
  get: () => selected.value?.style?.BorderColor || '#303133',
  set: (v: string | null) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.BorderColor = v || undefined;
  }
});

const fillColorProxy = computed({
  get: () => selected.value?.style?.FillColor || 'transparent',
  set: (v: string | null) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    const s = (v || '').trim();
    if (!s || s === 'transparent') delete selected.value.style.FillColor;
    else selected.value.style.FillColor = s;
  }
});

const lineWidthProxy = computed({
  get: () => selected.value?.style?.LineWidth ?? 1,
  set: (v: number | undefined) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.LineWidth = v ?? 1;
  }
});

const lineStyleProxy = computed({
  get: () => selected.value?.style?.LineStyle ?? 0,
  set: (v: number) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.LineStyle = v;
  }
});

const lineStyleSelectOptions = computed(() => [
  { value: 0, key: 'solid', label: t('printDesigner.canvas.lineStyleSolid') },
  { value: 1, key: 'dash', label: t('printDesigner.canvas.lineStyleDash') },
  { value: 2, key: 'dot', label: t('printDesigner.canvas.lineStyleDot') }
]);

const currentLineStyleKey = computed(
  () => lineStyleSelectOptions.value.find((o) => o.value === lineStyleProxy.value)?.key ?? 'solid'
);

const paginateProxy = computed({
  get: () => !!selected.value?.style?.paginate,
  set: (v: boolean) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.paginate = v;
  }
});

const pageRowsProxy = computed({
  get: () => selected.value?.style?.pageRows ?? 10,
  set: (v: number | undefined) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.pageRows = v == null ? undefined : Math.max(1, Math.floor(v));
  }
});

const autoHeightProxy = computed({
  get: () => !!selected.value?.style?.AutoHeight,
  set: (v: boolean) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.AutoHeight = v;
  }
});

const bottomMarginProxy = computed({
  get: () => selected.value?.style?.BottomMargin ?? 0,
  set: (v: number | undefined) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    selected.value.style.BottomMargin = v;
  }
});

/** Lodop ItemType: '' = omit; '0' = normal item */
const itemTypeSelectProxy = computed({
  get: () =>
    selected.value?.style?.ItemType === undefined || selected.value?.style?.ItemType === null
      ? ''
      : String(selected.value.style.ItemType),
  set: (v: string) => {
    if (!selected.value) return;
    if (!selected.value.style) selected.value.style = {};
    if (v === '') {
      delete selected.value.style.ItemType;
    } else {
      selected.value.style.ItemType = Number(v);
    }
  }
});

function tableCellBorderStyle(item: PrintTemplateItem, rowIndex: number, colIndex: number) {
  const cols = item.columnsAttr?.length || 1;
  const rows = 1 + tablePreviewRows(item).length;
  return previewTableCellBorderStyle(item, rowIndex, colIndex, rows, cols);
}

function columnTitle(c: TableColumnAttr): string {
  if (c.titleKey) return t(c.titleKey);
  return c.title ?? '';
}

function itemStyle(item: PrintTemplateItem): Record<string, string | number> {
  const base: Record<string, string | number> = {
    left: `${item.left}px`,
    top: `${item.top}px`,
    width: `${item.width}px`,
    height: `${item.height}px`,
    zIndex: (item.style?.zIndex ?? 0) + 2
  };
  if (isShapeItem(item) || isLineItem(item)) {
    base.background = 'transparent';
    base.border = 'none';
  }
  const fn = item.style?.FontName?.trim();
  const is2dBar =
    item.type === 'bar-code' && is2dBarcodeType(item.style?.codeType);
  if (fn && item.type !== 'braid-image' && !isShapeItem(item) && !is2dBar) {
    base.fontFamily = fn;
  }
  return base;
}

function normalizeDemoPlaceholders(row: Record<string, unknown>): Record<string, unknown> {
  const details = row.details;
  if (!Array.isArray(details)) return row;
  return {
    ...row,
    details: details.map((r: Record<string, unknown>) => ({
      ...r,
      productName:
        r.productName === '__demoA__'
          ? t('printDesigner.demoProductA')
          : r.productName === '__demoB__'
            ? t('printDesigner.demoProductB')
            : r.productName
    }))
  };
}

const demoData = computed(() => {
  if (props.printData?.length) return props.printData.map((r) => normalizeDemoPlaceholders(r));
  return [normalizeDemoPlaceholders(buildDemoRow())];
});

function buildDemoRow(): Record<string, unknown> {
  const row: Record<string, unknown> = {
    orderNo: 'ORDER-999',
    logoUrl: ''
  };
  for (const w of palette.value) {
    if (w.name) {
      if (w.type === 'braid-table' && w.defaultValue) row[w.name] = w.defaultValue;
      else if (w.defaultValue != null && !Array.isArray(w.defaultValue)) row[w.name] = w.defaultValue;
    }
  }
  for (const it of template.value.tempItems) {
    if (it.name && it.type === 'braid-table' && it.defaultValue) {
      row[it.name] = it.defaultValue;
    }
  }
  return row;
}

function isTextItem(item: PrintTemplateItem): boolean {
  return item.type === 'braid-txt';
}

function itemTitle(item: PrintTemplateItem) {
  const plain = item.title?.trim();
  if (plain) return plain;
  if (item.titleKey) return t(item.titleKey);
  return t('printDesigner.unnamedItem');
}

function previewText(item: PrintTemplateItem) {
  const row = demoData.value[0] || {};
  if (isShapeItem(item) || isLineItem(item)) return '';
  if (item.type === 'bar-code') return resolveBarcodeItemValue(item, row);
  if (item.type === 'braid-html') return String(t('printDesigner.canvas.htmlPreview'));
  return resolveTextItemValue(item, row);
}

function previewTextStyle(item: PrintTemplateItem): Record<string, string | number> {
  const s = item.style || {};
  const st: Record<string, string | number> = {};
  if (s.FontSize != null) st.fontSize = `${s.FontSize}px`;
  if (s.Bold) st.fontWeight = 'bold';
  if (s.Italic) st.fontStyle = 'italic';
  const decorations: string[] = [];
  if (s.Underline) decorations.push('underline');
  if (s.StrikeOut) decorations.push('line-through');
  if (decorations.length) st.textDecoration = decorations.join(' ');
  if (s.FontColor) st.color = s.FontColor;
  if (s.HighlightColor) st.backgroundColor = s.HighlightColor;
  if (s.Alignment) st.textAlign = s.Alignment;
  const fn = s.FontName?.trim();
  if (fn) st.fontFamily = fn;
  return st;
}

function tablePreviewRows(item: PrintTemplateItem) {
  const d = demoData.value[0];
  if (item.name && Array.isArray(d[item.name])) return d[item.name] as Record<string, unknown>[];
  if (Array.isArray(item.defaultValue)) return item.defaultValue as Record<string, unknown>[];
  return [];
}

function paletteDragActive(dt: DataTransfer): boolean {
  return [...dt.types].includes(PRINT_WIDGET_DRAG_MIME);
}

function onCanvasDragOver(e: DragEvent) {
  const dt = e.dataTransfer;
  if (!dt || !paletteDragActive(dt)) return;
  e.preventDefault();
  dt.dropEffect = 'copy';
}

function onCanvasDrop(e: DragEvent) {
  const dt = e.dataTransfer;
  if (!dt || !paletteDragActive(dt)) return;
  const raw = dt.getData(PRINT_WIDGET_DRAG_MIME);
  if (!raw) return;
  e.preventDefault();
  let w: WidgetOption;
  try {
    w = JSON.parse(raw) as WidgetOption;
  } catch {
    return;
  }
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  addFromWidget(w, { x, y });
}

function addFromWidget(w: WidgetOption, dropPosition?: { x: number; y: number }) {
  const baseLeft = 24 + (template.value.tempItems.length % 5) * 12;
  const baseTop = 24 + (template.value.tempItems.length % 3) * 12;
  const iw = w.width ?? 120;
  const ih = w.height ?? 40;
  let left = w.left ?? baseLeft;
  let top = w.top ?? baseTop;
  if (dropPosition) {
    left = Math.round(dropPosition.x - iw / 2);
    top = Math.round(dropPosition.y - ih / 2);
    left = Math.max(0, Math.min(left, template.value.width - iw));
    top = Math.max(0, Math.min(top, template.value.height - ih));
  }
  const resolvedTitle = w.title?.trim() || (w.titleKey ? t(w.titleKey) : t('printDesigner.unnamedItem'));
  const item: PrintTemplateItem = {
    id: newId(),
    type: w.type,
    title: resolvedTitle,
    titleKey: w.titleKey,
    value: w.value ?? '',
    defaultValue: w.defaultValue,
    name: w.name,
    isEdit: w.isEdit,
    dragable: w.dragable ?? true,
    resizable: w.resizable ?? true,
    left,
    top,
    width: iw,
    height: ih,
    style: { ...(w.style || {}), zIndex: w.style?.zIndex ?? template.value.tempItems.length },
    lodopStyle: { ...(w.lodopStyle || {}) },
    columnsAttr: w.columnsAttr ? JSON.parse(JSON.stringify(w.columnsAttr)) : undefined
  };
  template.value.tempItems.push(item);
  selectedId.value = item.id;
}

function clearSelect() {
  selectedId.value = null;
}

function removeSelected() {
  if (!selectedId.value) return;
  removeItemById(selectedId.value);
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return !!target.closest('.el-input, .el-textarea, .el-select, [contenteditable="true"]');
}

function onDesignerKeyDown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === 'z' || e.key === 'Z')) {
    if (isEditableKeyboardTarget(e.target)) return;
    e.preventDefault();
    if (e.shiftKey) performRedo();
    else performUndo();
    return;
  }
  if (mod && (e.key === 'y' || e.key === 'Y')) {
    if (isEditableKeyboardTarget(e.target)) return;
    e.preventDefault();
    performRedo();
    return;
  }
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  if (isEditableKeyboardTarget(e.target)) return;
  if (!selectedId.value) return;
  e.preventDefault();
  removeSelected();
}

function removeItemById(id: string) {
  const idx = template.value.tempItems.findIndex((i) => i.id === id);
  if (idx >= 0) template.value.tempItems.splice(idx, 1);
  if (selectedId.value === id) selectedId.value = null;
}

/** Load template JSON from outside (widgets stay via prop widgetOptions) */
function initTemp(temp: PrintTemplate) {
  suppressHistory = true;
  template.value = {
    ...temp,
    tempItems: (temp.tempItems || []).map((i) => {
      const withId = { ...i, id: i.id || newId() };
      return normalizeLineTemplateItem(withId);
    })
  };
  undoStack.value = [];
  redoStack.value = [];
  lastSnapshot = snapshotTemplate(template.value);
  requestAnimationFrame(() => {
    suppressHistory = false;
  });
}

defineExpose({ initTemp });

type DragCtx = {
  kind: 'move' | 'resize';
  id: string;
  startX: number;
  startY: number;
  origLeft: number;
  origTop: number;
  origW: number;
  origH: number;
};

const drag = ref<DragCtx | null>(null);

type AlignGuide = { orientation: 'h' | 'v'; position: number };
const alignGuides = ref<AlignGuide[]>([]);
const ALIGN_SNAP_THRESHOLD = 5;

function onItemDown(e: MouseEvent, item: PrintTemplateItem) {
  if (item.dragable === false) return;
  selectedId.value = item.id;
  drag.value = {
    kind: 'move',
    id: item.id,
    startX: e.clientX,
    startY: e.clientY,
    origLeft: item.left,
    origTop: item.top,
    origW: item.width,
    origH: item.height
  };
}

function onResizeDown(e: MouseEvent, item: PrintTemplateItem) {
  selectedId.value = item.id;
  drag.value = {
    kind: 'resize',
    id: item.id,
    startX: e.clientX,
    startY: e.clientY,
    origLeft: item.left,
    origTop: item.top,
    origW: item.width,
    origH: item.height
  };
}

function collectAlignTargets(excludeId: string) {
  const pageW = template.value.width;
  const pageH = template.value.height;
  const vTargets = new Set<number>([0, pageW / 2, pageW]);
  const hTargets = new Set<number>([0, pageH / 2, pageH]);
  for (const other of template.value.tempItems) {
    if (other.id === excludeId) continue;
    vTargets.add(other.left);
    vTargets.add(other.left + other.width / 2);
    vTargets.add(other.left + other.width);
    hTargets.add(other.top);
    hTargets.add(other.top + other.height / 2);
    hTargets.add(other.top + other.height);
  }
  return { vTargets: [...vTargets], hTargets: [...hTargets] };
}

function findSnap(values: number[], targets: number[]) {
  let bestDiff = ALIGN_SNAP_THRESHOLD + 1;
  let snapDelta = 0;
  for (const v of values) {
    for (const t of targets) {
      const diff = t - v;
      const abs = Math.abs(diff);
      if (abs <= ALIGN_SNAP_THRESHOLD && abs < bestDiff) {
        bestDiff = abs;
        snapDelta = diff;
      }
    }
  }
  return { snapped: bestDiff <= ALIGN_SNAP_THRESHOLD, snapDelta };
}

function collectMatchedGuides(
  values: number[],
  targets: number[],
  orientation: 'h' | 'v'
): AlignGuide[] {
  const out: AlignGuide[] = [];
  const seen = new Set<number>();
  for (const v of values) {
    for (const t of targets) {
      if (Math.abs(v - t) < 0.5 && !seen.has(t)) {
        seen.add(t);
        out.push({ orientation, position: t });
      }
    }
  }
  return out;
}

function updateAlignGuidesForMove(item: PrintTemplateItem, rawLeft: number, rawTop: number) {
  const w = item.width;
  const h = item.height;
  const { vTargets, hTargets } = collectAlignTargets(item.id);
  const vValues = [rawLeft, rawLeft + w / 2, rawLeft + w];
  const hValues = [rawTop, rawTop + h / 2, rawTop + h];
  const vSnap = findSnap(vValues, vTargets);
  const hSnap = findSnap(hValues, hTargets);
  const snappedLeft = rawLeft + (vSnap.snapped ? vSnap.snapDelta : 0);
  const snappedTop = rawTop + (hSnap.snapped ? hSnap.snapDelta : 0);
  const finalV = [snappedLeft, snappedLeft + w / 2, snappedLeft + w];
  const finalH = [snappedTop, snappedTop + h / 2, snappedTop + h];
  alignGuides.value = [
    ...collectMatchedGuides(finalV, vTargets, 'v'),
    ...collectMatchedGuides(finalH, hTargets, 'h')
  ];
  return { left: snappedLeft, top: snappedTop };
}

function updateAlignGuidesForResize(item: PrintTemplateItem, rawW: number, rawH: number) {
  const left = item.left;
  const top = item.top;
  const { vTargets, hTargets } = collectAlignTargets(item.id);
  const vSnap = findSnap([left + rawW], vTargets);
  const hSnap = findSnap([top + rawH], hTargets);
  const snappedW = rawW + (vSnap.snapped ? vSnap.snapDelta : 0);
  const snappedH = rawH + (hSnap.snapped ? hSnap.snapDelta : 0);
  alignGuides.value = [
    ...collectMatchedGuides([left + snappedW], vTargets, 'v'),
    ...collectMatchedGuides([top + snappedH], hTargets, 'h')
  ];
  return { width: snappedW, height: snappedH };
}

function onMouseMove(e: MouseEvent) {
  const ctx = drag.value;
  if (!ctx) return;
  const it = template.value.tempItems.find((i) => i.id === ctx.id);
  if (!it) return;
  const dx = e.clientX - ctx.startX;
  const dy = e.clientY - ctx.startY;
  if (ctx.kind === 'move') {
    const rawLeft = Math.max(0, ctx.origLeft + dx);
    const rawTop = Math.max(0, ctx.origTop + dy);
    if (e.altKey) {
      alignGuides.value = [];
      it.left = rawLeft;
      it.top = rawTop;
    } else {
      const { left, top } = updateAlignGuidesForMove(it, rawLeft, rawTop);
      it.left = Math.max(0, left);
      it.top = Math.max(0, top);
    }
  } else {
    const rawW = Math.max(20, ctx.origW + dx);
    const rawH = Math.max(20, ctx.origH + dy);
    if (e.altKey) {
      alignGuides.value = [];
      it.width = rawW;
      it.height = rawH;
    } else {
      const { width, height } = updateAlignGuidesForResize(it, rawW, rawH);
      it.width = Math.max(20, width);
      it.height = Math.max(20, height);
    }
  }
}

function onMouseUp() {
  drag.value = null;
  alignGuides.value = [];
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onDesignerKeyDown);
});
onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('keydown', onDesignerKeyDown);
});

async function handlePreview() {
  try {
    const ready = await waitForLodopReady();
    if (!ready) {
      ElMessage.error(t('printDesigner.lodopMissing'));
      return;
    }
    lodopPrint.preview(template.value, demoData.value);
  } catch (err) {
    console.error(err);
    const msg = (err as Error).message || '';
    ElMessage.error(msg.includes('C-Lodop') ? t('printDesigner.lodopMissing') : msg || t('printDesigner.lodopMissing'));
  }
}

async function handlePrint() {
  try {
    const ready = await waitForLodopReady();
    if (!ready) {
      ElMessage.error(t('printDesigner.lodopMissing'));
      return;
    }
    lodopPrint.print(template.value, demoData.value);
  } catch (err) {
    console.error(err);
    ElMessage.error((err as Error).message || t('printDesigner.lodopMissing'));
  }
}
</script>

<style scoped lang="scss">
.print-designer {
  height: 100%;
  min-height: 560px;
}
.pd-container {
  height: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.pd-aside {
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
}
.pd-sidebar-left {
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color-lighter);
}
.pd-sidebar-right {
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-lighter);
}
.pd-sidebar-scroll :deep(.el-scrollbar__view) {
  padding-right: 4px;
}
.pd-aside-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.widget-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.widget-btn {
  width: 100%;
  justify-content: flex-start;
}
.w100 {
  width: 100% !important;
}
.pd-sidebar-collapse :deep(.el-collapse-item__header) {
  padding-left: 2px;
}
.pd-section-form {
  padding: 0 2px 4px;
}
.pd-form-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.35;
}
.pd-form-hint--inline {
  margin-top: 0;
  margin-left: 8px;
}
.pd-toolbar-sep {
  display: inline-block;
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--el-border-color);
  flex-shrink: 0;
}
.pd-text-format-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-bg-color);
  flex-shrink: 0;
}
.pd-fmt-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--el-border-color-lighter);
  flex-shrink: 0;
}
.pd-fmt-icon {
  font-size: 14px;
}
.pd-font-select--toolbar {
  width: 130px;
}
.pd-font-select--toolbar :deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
  padding: 0 6px;
}
.pd-font-select--toolbar :deep(.el-input__wrapper:hover) {
  background: var(--el-fill-color-light);
}
.pd-font-select--toolbar :deep(.el-input__inner) {
  font-size: 12px;
  height: 24px;
}
.pd-font-size-select {
  width: 62px;
}
.pd-font-size-select :deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
  padding: 0 4px;
}
.pd-font-size-select :deep(.el-input__wrapper:hover) {
  background: var(--el-fill-color-light);
}
.pd-font-size-select :deep(.el-input__inner) {
  text-align: center;
  font-size: 12px;
  height: 24px;
}
.pd-font-size-select :deep(.el-select__suffix) {
  display: none;
}
.pd-fmt-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 14px;
  font-family: 'Times New Roman', Georgia, serif;
  line-height: 1;
  transition: background-color 0.15s, color 0.15s;
}
.pd-fmt-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.pd-fmt-btn.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.pd-fmt-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.pd-fmt-btn:disabled:hover {
  background: transparent;
  color: var(--el-text-color-regular);
}
.pd-fmt-btn--bold {
  font-weight: 700;
}
.pd-fmt-btn--italic {
  font-style: italic;
  font-weight: 600;
}
.pd-fmt-btn--underline {
  text-decoration: underline;
  font-weight: 600;
}
.pd-fmt-btn--strike {
  text-decoration: line-through;
  font-weight: 600;
}
.pd-fmt-color {
  display: inline-flex;
}
.pd-fmt-color :deep(.pd-color-trigger) {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 3px;
  gap: 1px;
}
.pd-fmt-color :deep(.pd-color-trigger:hover) {
  background: var(--el-fill-color-light);
}
.pd-fmt-line-btn {
  font-family: inherit;
}
.pd-fmt-line-btn__preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  width: 16px;
  height: 12px;
}
.pd-fmt-line-btn__preview .pd-line-style-preview {
  width: 100%;
  border-top-width: 1.5px;
}
.pd-line-style-preview {
  display: block;
  width: 100%;
  height: 0;
  border-top: 2px solid var(--el-text-color-primary);
}
.pd-line-style-preview--dash {
  border-top-style: dashed;
}
.pd-line-style-preview--dot {
  border-top-style: dotted;
}
.pd-barcode-bg-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pd-border-form-item {
  margin-bottom: 12px;
  :deep(.el-form-item__content) {
    line-height: normal;
  }
}
.pd-section-form :deep(.el-divider--horizontal) {
  margin: 12px 0 14px;
}
.layer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.layer-tag {
  cursor: pointer;
  max-width: 100%;
}
.layer-tag :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}
.pd-collapse {
  border: none;
  --el-collapse-border-color: transparent;
}
.pd-collapse :deep(.el-collapse-item__header) {
  font-weight: 600;
  font-size: 13px;
  min-height: 40px;
  padding: 0 4px;
}
.pd-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.pd-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 12px;
}
.pd-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: var(--el-fill-color-light);
  flex: 1;
  min-width: 0;
}
.pd-toolbar {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pd-tool-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.15s, color 0.15s;
}
.pd-tool-btn:hover:not(:disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.pd-tool-btn:active:not(:disabled) {
  background: var(--el-fill-color);
}
.pd-tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pd-tool-btn--primary:hover:not(:disabled) {
  color: var(--el-color-primary);
}
.pd-tool-btn--success:hover:not(:disabled) {
  color: var(--el-color-success);
}
.pd-tool-btn--danger {
  color: var(--el-color-danger);
}
.pd-tool-btn--danger:hover:not(:disabled) {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.canvas-scroll {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 16px;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #f5f5f5 25%, transparent 0, transparent 75%, #f5f5f5 0),
    linear-gradient(45deg, #f5f5f5 25%, transparent 0, transparent 75%, #f5f5f5 0);
  background-size:
    26px 26px,
    26px 26px;
  background-position:
    0 0,
    13px 13px;
}
.design-page {
  position: relative;
  margin: 0 auto;
  box-shadow: 0 1px 6px rgb(0 0 0 / 12%);
  background: #fff;
}
.pd-align-guide {
  position: absolute;
  pointer-events: none;
  background: #ff3b30;
  z-index: 9999;
  box-shadow: 0 0 2px rgba(255, 59, 48, 0.4);
}
.pd-align-guide--v {
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-0.5px);
}
.pd-align-guide--h {
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-0.5px);
}
.pd-item-shape--border .pd-item-label {
  display: none;
}
.pd-item-shape--border .pd-shape-preview {
  background: transparent !important;
}
.pd-item {
  position: absolute;
  border: 1px dashed var(--el-color-info-light-5);
  background: rgb(255 255 255 / 92%);
  cursor: move;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.pd-item.active {
  box-shadow: 0 0 0 2px var(--el-color-primary);
}
.pd-item-shape.active {
  border-color: transparent;
  box-shadow: 0 0 0 2px var(--el-color-primary);
}
.pd-item-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  padding: 2px 4px;
  background: var(--el-fill-color-light);
}
.pd-item-body {
  flex: 1;
  padding: 4px;
  word-break: break-all;
  overflow: hidden;
}
.pd-item-body--barcode {
  padding: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  word-break: normal;
}
.pd-item:has(.pd-item-body--barcode) {
  background: #fff;
}
.pd-item-body--text {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 2px 6px;
  overflow: hidden;
  word-break: normal;
}
.pd-item:has(.pd-item-body--text) {
  background: rgb(255 255 255 / 96%);
}
.pd-text-preview {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-wrap;
  line-height: 1.35;
  color: var(--el-text-color-primary);
}
.pd-item-shape {
  background: transparent !important;
  overflow: visible;
  display: flex;
  flex-direction: column;
  padding: 0 4px 10px;
  box-sizing: border-box;
}
.pd-item-shape .pd-item-label {
  position: relative;
  flex: 0 0 auto;
  z-index: 1;
  align-self: flex-start;
  max-width: 100%;
  margin: 0;
  padding: 1px 4px 3px;
  line-height: 1.2;
  background: rgb(255 255 255 / 85%);
  pointer-events: none;
}
.pd-shape-preview {
  position: relative;
  flex: 1 1 auto;
  min-height: 4px;
  width: 100%;
  margin: 0;
  pointer-events: none;
  box-sizing: border-box;
}
.pd-item-line {
  background: transparent !important;
  overflow: visible;
  display: flex;
  flex-direction: column;
  padding: 0 4px 10px;
  box-sizing: border-box;
  justify-content: center;
}
.pd-item-line .pd-item-label {
  position: relative;
  flex: 0 0 auto;
  z-index: 1;
  align-self: flex-start;
  max-width: 100%;
  margin: 0;
  padding: 1px 4px 3px;
  line-height: 1.2;
  background: rgb(255 255 255 / 85%);
  pointer-events: none;
}
.pd-line-preview {
  flex: 1 1 auto;
  min-height: 2px;
  min-width: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.pd-item-line--v .pd-line-preview {
  flex-direction: row;
}
.pd-item-table .mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}
.pd-item-table .mini-table {
  width: 100%;
  border-collapse: collapse;
}
.pd-item-table .mini-table th,
.pd-item-table .mini-table td {
  padding: 2px 4px;
}
.pd-item.active .resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  cursor: se-resize;
  background: linear-gradient(-45deg, transparent 50%, var(--el-color-primary) 50%);
}
</style>
