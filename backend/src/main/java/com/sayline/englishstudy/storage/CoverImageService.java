package com.sayline.englishstudy.storage;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

import com.sayline.englishstudy.catalog.Book;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CoverImageService {

    private static final Logger log = LoggerFactory.getLogger(CoverImageService.class);
    private static final int THUMBNAIL_MAX_EDGE = 400;

    private final StorageService storageService;

    public CoverImageService(StorageService storageService) {
        this.storageService = storageService;
    }

    /** 生成缩略图 + 提取主色，best-effort：任何一步失败都保持原图。 */
    public void process(Book book) {
        String objectKey = book.getCoverObjectKey();
        if (isBlank(objectKey)) {
            return;
        }
        try {
            byte[] original = storageService.readBytes(objectKey);
            if (original == null || original.length == 0) {
                return;
            }
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(original));
            if (image == null) {
                return; // 无法解码（如 WebP），回退原图
            }
            book.setSpineColor(dominantColor(image));
            String thumbnailKey = thumbnailKey(objectKey);
            storageService.uploadBytes(thumbnailKey, "image/jpeg", thumbnail(image));
            book.setCoverThumbnailObjectKey(thumbnailKey);
        } catch (Exception exception) {
            log.warn("封面缩略图生成失败，回退原图: {}", objectKey, exception);
        }
    }

    private byte[] thumbnail(BufferedImage source) throws Exception {
        int width = source.getWidth();
        int height = source.getHeight();
        int maxEdge = Math.max(width, height);
        BufferedImage target = source;
        if (maxEdge > THUMBNAIL_MAX_EDGE) {
            double ratio = (double) THUMBNAIL_MAX_EDGE / maxEdge;
            int targetWidth = Math.max(1, (int) Math.round(width * ratio));
            int targetHeight = Math.max(1, (int) Math.round(height * ratio));
            target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = target.createGraphics();
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
            graphics.dispose();
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        if (!ImageIO.write(target, "jpeg", output)) {
            throw new IOException("No JPEG image writer is available");
        }
        return output.toByteArray();
    }

    private String dominantColor(BufferedImage source) {
        BufferedImage small = new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = small.createGraphics();
        graphics.drawImage(source, 0, 0, 32, 32, null);
        graphics.dispose();
        int maxKey = modeColor(small, true);
        if (maxKey < 0) {
            maxKey = modeColor(small, false);
        }
        int r = (maxKey >> 8 & 0xf) << 4 | 0xf;
        int g = (maxKey >> 4 & 0xf) << 4 | 0xf;
        int b = (maxKey & 0xf) << 4 | 0xf;
        return String.format("#%02x%02x%02x", r, g, b);
    }

    private int modeColor(BufferedImage small, boolean skipBackground) {
        Map<Integer, Integer> counts = new HashMap<>();
        int maxCount = 0;
        int maxKey = -1;
        for (int y = 0; y < 32; y++) {
            for (int x = 0; x < 32; x++) {
                int rgb = small.getRGB(x, y);
                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;
                if (skipBackground && isBackground(r, g, b)) {
                    continue;
                }
                int key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
                int count = counts.merge(key, 1, Integer::sum);
                if (count > maxCount) {
                    maxCount = count;
                    maxKey = key;
                }
            }
        }
        return maxKey;
    }

    private boolean isBackground(int r, int g, int b) {
        int max = Math.max(r, Math.max(g, b));
        int min = Math.min(r, Math.min(g, b));
        return max - min < 30;
    }

    private String thumbnailKey(String objectKey) {
        int dot = objectKey.lastIndexOf('.');
        String base = dot > 0 ? objectKey.substring(0, dot) : objectKey;
        return base + "_thumb.jpg";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
