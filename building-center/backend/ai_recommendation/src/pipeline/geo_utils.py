#!/usr/bin/env python3
"""
地理计算工具函数

提供高效、准确的地理距离计算和空间过滤功能。
支持跨纬度、换日线安全的距离计算。
"""

from __future__ import annotations

import math
from typing import Tuple

# 地球半径（英里）- WGS84椭球体平均半径
R_MILES = 3958.7613

# 角度转换常数
DEG_PER_RADIAN = 180.0 / math.pi
RADIAN_PER_DEG = math.pi / 180.0


def bbox_thresholds(lat_deg: float, radius_miles: float) -> Tuple[float, float]:
    """
    计算给定纬度和半径下的纬度/经度阈值（度）
    
    用于粗略过滤：如果点的纬度差或经度差超过这些阈值，
    则该点一定在圆外，可以直接跳过 Haversine 计算。
    
    Args:
        lat_deg: 基准点纬度（度）
        radius_miles: 搜索半径（英里）
    
    Returns:
        (dlat_deg, dlon_deg): 纬度阈值和经度阈值（度）
    
    算法：
        dlat = (radius / R) * (180/π)
        dlon = (radius / (R * cos(φ))) * (180/π)
    
    注意：
        - 经度阈值根据纬度动态计算，避免高/低纬度误差
        - 在极地附近（cos(φ)→0），使用最小值防止数值发散
    """
    # 纬度阈值（全球一致）
    dlat_deg = (radius_miles / R_MILES) * DEG_PER_RADIAN
    
    # 经度阈值（随纬度变化）
    cos_lat = math.cos(math.radians(lat_deg))
    # 防止极地附近cos(φ)→0导致的数值问题
    cos_lat = max(cos_lat, 1e-12)
    dlon_deg = (radius_miles / (R_MILES * cos_lat)) * DEG_PER_RADIAN
    
    return dlat_deg, dlon_deg


def lon_diff_deg(lon1: float, lon2: float) -> float:
    """
    计算两个经度之间的最短角度差（度），处理换日线
    
    Args:
        lon1, lon2: 经度值（度），范围 [-180, 180] 或 [0, 360]
    
    Returns:
        最短角度差（度），范围 [0, 180]
    
    示例：
        lon_diff_deg(170, -170) = 20  # 跨越换日线
        lon_diff_deg(10, 20) = 10     # 正常情况
    """
    diff = abs(lon2 - lon1) % 360.0
    return min(diff, 360.0 - diff)


def haversine_distance(
    lat1: float, 
    lon1: float, 
    lat2: float, 
    lon2: float
) -> float:
    """
    使用 Haversine 公式计算两点间的大圆距离（英里）
    
    Args:
        lat1, lon1: 第一个点的纬度、经度（度）
        lat2, lon2: 第二个点的纬度、经度（度）
    
    Returns:
        距离（英里）
    
    算法：
        a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
        c = 2·atan2(√a, √(1-a))
        d = R·c
    
    注意：
        - 正确处理换日线（使用 lon_diff_deg）
        - WGS84坐标系
    """
    # 转换为弧度
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    
    # 处理换日线的经度差
    delta_lambda = math.radians(lon_diff_deg(lon1, lon2))
    
    # Haversine 公式
    a = (
        math.sin(delta_phi / 2) ** 2 +
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    
    c = 2 * math.asin(math.sqrt(a))
    
    return R_MILES * c


def is_within_radius(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
    radius_miles: float
) -> bool:
    """
    高效判断两点是否在给定半径内（两步过滤）
    
    Step 1: 粗略过滤（快速矩形边界检查）
    Step 2: 精确计算（Haversine距离）
    
    Args:
        lat1, lon1: 第一个点（通常是建筑物）
        lat2, lon2: 第二个点（POI、投诉等）
        radius_miles: 半径阈值（英里）
    
    Returns:
        True 如果距离 <= radius_miles
    
    性能：
        - 粗滤可以排除 95%+ 的点，避免昂贵的三角函数计算
        - 对大量点集合查询时性能提升显著
    """
    # Step 1: 粗略过滤（矩形边界框）
    dlat_threshold, dlon_threshold = bbox_thresholds(lat1, radius_miles)
    
    lat_diff = abs(lat2 - lat1)
    lon_diff = lon_diff_deg(lon1, lon2)
    
    # 如果超出矩形边界，一定在圆外
    if lat_diff > dlat_threshold or lon_diff > dlon_threshold:
        return False
    
    # Step 2: 精确计算（Haversine）
    distance = haversine_distance(lat1, lon1, lat2, lon2)
    return distance <= radius_miles


def count_nearby_points(
    center_lat: float,
    center_lon: float,
    points: list,
    radius_miles: float,
    lat_key: str = "lat",
    lon_key: str = "lon"
) -> int:
    """
    计算中心点周围半径内的点数量
    
    Args:
        center_lat, center_lon: 中心点坐标
        points: 点列表（字典列表）
        radius_miles: 搜索半径（英里）
        lat_key, lon_key: 坐标字段名
    
    Returns:
        在半径内的点数量
    
    示例：
        buildings = [{"lat": 37.7, "lon": -122.4, ...}, ...]
        count = count_nearby_points(37.75, -122.42, buildings, 1.0)
    """
    count = 0
    
    for point in points:
        point_lat = point.get(lat_key)
        point_lon = point.get(lon_key)
        
        # 跳过缺少坐标的点
        if point_lat is None or point_lon is None:
            continue
        
        # 使用高效的两步过滤
        if is_within_radius(center_lat, center_lon, point_lat, point_lon, radius_miles):
            count += 1
    
    return count


def filter_nearby_points(
    center_lat: float,
    center_lon: float,
    points: list,
    radius_miles: float,
    lat_key: str = "lat",
    lon_key: str = "lon"
) -> list:
    """
    过滤出中心点周围半径内的所有点
    
    Args:
        center_lat, center_lon: 中心点坐标
        points: 点列表（字典列表）
        radius_miles: 搜索半径（英里）
        lat_key, lon_key: 坐标字段名
    
    Returns:
        在半径内的点列表
    """
    nearby = []
    
    for point in points:
        point_lat = point.get(lat_key)
        point_lon = point.get(lon_key)
        
        if point_lat is None or point_lon is None:
            continue
        
        if is_within_radius(center_lat, center_lon, point_lat, point_lon, radius_miles):
            nearby.append(point)
    
    return nearby


# ============================================================================
# 性能测试和验证
# ============================================================================

def _validate_calculations():
    """验证计算的正确性"""
    print("验证地理计算函数...")
    
    # 测试1: 旧金山两点距离（已知答案）
    # Golden Gate Bridge: 37.8199, -122.4783
    # Ferry Building: 37.7955, -122.3937
    dist = haversine_distance(37.8199, -122.4783, 37.7955, -122.3937)
    print(f"  Golden Gate Bridge → Ferry Building: {dist:.2f} miles")
    print(f"    预期约 5.5 miles")
    
    # 测试2: 换日线处理
    dist_dateline = haversine_distance(0, 179, 0, -179)
    print(f"  跨换日线距离 (0°N, 179°E) → (0°N, 179°W): {dist_dateline:.2f} miles")
    print(f"    预期约 138 miles（2度经度在赤道）")
    
    # 测试3: 高纬度
    # 接近北极
    dist_arctic = haversine_distance(85, 0, 85, 90)
    print(f"  高纬度距离 (85°N, 0°) → (85°N, 90°E): {dist_arctic:.2f} miles")
    
    # 测试4: 粗滤阈值
    dlat, dlon = bbox_thresholds(37.7, 1.0)
    print(f"  旧金山1英里粗滤阈值: Δlat={dlat:.4f}°, Δlon={dlon:.4f}°")
    
    print("✅ 验证完成")


if __name__ == "__main__":
    _validate_calculations()

